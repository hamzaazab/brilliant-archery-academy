const fs = require('fs/promises');
const path = require('path');
const bcrypt = require('bcryptjs');
const { Sequelize, DataTypes, fn, col, where } = require('sequelize');

const connectionString = process.env.DATABASE_URL;
const useSsl = process.env.PG_SSL === 'true';
const SEED_FILE = path.join(__dirname, 'data', 'content.json');

function buildSequelize() {
  const dialectOptions = useSsl
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    : undefined;

  const baseOptions = {
    dialect: 'postgres',
    logging: false,
    dialectOptions
  };

  if (connectionString) {
    return new Sequelize(connectionString, baseOptions);
  }

  return new Sequelize(
    process.env.PG_DATABASE || 'postgres',
    process.env.PG_USER || 'postgres',
    process.env.PG_PASSWORD || 'postgres',
    {
      ...baseOptions,
      host: process.env.PG_HOST || 'localhost',
      port: Number(process.env.PG_PORT) || 5432
    }
  );
}

const sequelize = buildSequelize();

const Ranking = sequelize.define(
  'Ranking',
  {
    rank_position: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    player_name: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: ''
    },
    participations: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    medals: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    gold_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    silver_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    bronze_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    points: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  },
  {
    tableName: 'rankings',
    timestamps: false
  }
);

const Tournament = sequelize.define(
  'Tournament',
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    title: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    type: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: 'رسمية'
    },
    event_date: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    location: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: ''
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: ''
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: ''
    },
    images: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    accent: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: 'amber'
    }
  },
  {
    tableName: 'tournaments',
    timestamps: false
  }
);

const Admin = sequelize.define(
  'Admin',
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true
    },
    password_hash: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    tableName: 'admins',
    timestamps: false
  }
);

async function seedIfNeeded({ defaultAdminUsername, defaultAdminPassword } = {}) {
  const [rankCount, tournamentCount] = await Promise.all([Ranking.count(), Tournament.count()]);

  if (rankCount === 0 || tournamentCount === 0) {
    const seedRaw = await fs.readFile(SEED_FILE, 'utf8');
    const seed = JSON.parse(seedRaw);

    const transaction = await sequelize.transaction();
    try {
      if (rankCount === 0 && Array.isArray(seed.rankings) && seed.rankings.length > 0) {
        await Ranking.bulkCreate(
          seed.rankings.map((row) => ({
            rank_position: Number(row.rank) || 0,
            player_name: row.name || '',
            participations: Number(row.participations) || 0,
            medals: Number(row.medals) || 0,
            gold_count: Number(row.gold) || 0,
            silver_count: Number(row.silver) || 0,
            bronze_count: Number(row.bronze) || 0,
            points: Number(row.points) || 0
          })),
          { transaction }
        );
      }

      if (tournamentCount === 0 && Array.isArray(seed.tournaments) && seed.tournaments.length > 0) {
        await Tournament.bulkCreate(
          seed.tournaments.map((row) => ({
            id: Number(row.id) || 0,
            title: row.title || '',
            type: row.type || 'رسمية',
            event_date: row.date || '',
            location: row.location || '',
            summary: row.summary || '',
            description: row.description || '',
            images: Array.isArray(row.images) ? row.images : [],
            accent: row.accent || 'amber'
          })),
          { transaction }
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  await ensureDefaultAdmin(defaultAdminUsername, defaultAdminPassword);
}

function mapRankingRow(row) {
  return {
    rank: Number(row.rank_position) || 0,
    name: row.player_name || '',
    participations: Number(row.participations) || 0,
    medals: Number(row.medals) || 0,
    gold: Number(row.gold_count) || 0,
    silver: Number(row.silver_count) || 0,
    bronze: Number(row.bronze_count) || 0,
    points: Number(row.points) || 0
  };
}

function mapTournamentRow(row) {
  return {
    id: Number(row.id) || 0,
    title: row.title || '',
    type: row.type || 'رسمية',
    date: row.event_date || '',
    location: row.location || '',
    summary: row.summary || '',
    description: row.description || '',
    images: Array.isArray(row.images) ? row.images : [],
    accent: row.accent || 'amber'
  };
}

async function initializeDatabase(options = {}) {
  // ORM sync creates missing tables and applies non-destructive column updates.
  await sequelize.authenticate();
  await sequelize.sync({ alter: true });
  await seedIfNeeded(options);
}

async function ensureDefaultAdmin(defaultAdminUsername, defaultAdminPassword) {
  const username = String(defaultAdminUsername || '').trim();
  const password = String(defaultAdminPassword || '').trim();

  if (!username || !password) {
    return;
  }

  const existing = await getAdminByUsername(username);
  if (existing) {
    return;
  }

  const passwordHash = password.startsWith('$2') ? password : await bcrypt.hash(password, 10);
  await Admin.create({ username, password_hash: passwordHash });
}

async function getAdminByUsername(username) {
  const normalizedUsername = String(username || '').trim();
  if (!normalizedUsername) {
    return null;
  }

  const admin = await Admin.findOne({
    where: where(fn('LOWER', col('username')), normalizedUsername.toLowerCase()),
    raw: true
  });

  if (!admin) {
    return null;
  }

  return {
    username: admin.username,
    passwordHash: admin.password_hash,
    createdAt: admin.created_at
  };
}

async function listAdmins() {
  const admins = await Admin.findAll({
    attributes: ['username', 'created_at'],
    order: [['created_at', 'DESC']],
    raw: true
  });

  return admins.map((admin) => ({
    username: admin.username,
    createdAt: admin.created_at
  }));
}

async function createAdminUser(username, password) {
  const normalizedUsername = String(username || '').trim();
  const normalizedPassword = String(password || '').trim();

  if (!normalizedUsername || !normalizedPassword) {
    const error = new Error('Username and password are required');
    error.code = 'INVALID_ADMIN_PAYLOAD';
    throw error;
  }

  const passwordHash = normalizedPassword.startsWith('$2')
    ? normalizedPassword
    : await bcrypt.hash(normalizedPassword, 10);

  const existing = await getAdminByUsername(normalizedUsername);
  if (existing) {
    const duplicateError = new Error('Admin username already exists');
    duplicateError.code = 'DUPLICATE_ADMIN';
    throw duplicateError;
  }

  const created = await Admin.create({
    username: normalizedUsername,
    password_hash: passwordHash
  });

  return {
    username: created.username,
    createdAt: created.created_at
  };
}

async function getRankings() {
  const rows = await Ranking.findAll({
    order: [['rank_position', 'ASC']],
    raw: true
  });

  return rows.map(mapRankingRow);
}

async function getTournaments() {
  const rows = await Tournament.findAll({
    order: [['id', 'ASC']],
    raw: true
  });

  return rows.map(mapTournamentRow);
}

async function getContent() {
  const [rankings, tournaments] = await Promise.all([getRankings(), getTournaments()]);
  return { rankings, tournaments };
}

async function replaceRankings(rankings) {
  const transaction = await sequelize.transaction();
  try {
    await Ranking.destroy({ where: {}, truncate: true, transaction });

    if (Array.isArray(rankings) && rankings.length > 0) {
      await Ranking.bulkCreate(
        rankings.map((row) => ({
          rank_position: Number(row.rank) || 0,
          player_name: row.name || '',
          participations: Number(row.participations) || 0,
          medals: Number(row.medals) || 0,
          gold_count: Number(row.gold) || 0,
          silver_count: Number(row.silver) || 0,
          bronze_count: Number(row.bronze) || 0,
          points: Number(row.points) || 0
        })),
        { transaction }
      );
    }

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  return getRankings();
}

async function replaceTournaments(tournaments) {
  const transaction = await sequelize.transaction();
  try {
    await Tournament.destroy({ where: {}, truncate: true, transaction });

    if (Array.isArray(tournaments) && tournaments.length > 0) {
      await Tournament.bulkCreate(
        tournaments.map((row) => ({
          id: Number(row.id) || 0,
          title: row.title || '',
          type: row.type || 'رسمية',
          event_date: row.date || '',
          location: row.location || '',
          summary: row.summary || '',
          description: row.description || '',
          images: Array.isArray(row.images) ? row.images : [],
          accent: row.accent || 'amber'
        })),
        { transaction }
      );
    }

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  return getTournaments();
}

module.exports = {
  initializeDatabase,
  getRankings,
  getTournaments,
  getContent,
  replaceRankings,
  replaceTournaments,
  getAdminByUsername,
  listAdmins,
  createAdminUser
};
