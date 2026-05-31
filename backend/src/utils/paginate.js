const getPaginationMeta = (total, page, perPage) => ({
  page: Number(page),
  perPage: Number(perPage),
  total: Number(total),
  totalPages: Math.ceil(Number(total) / Number(perPage)),
});

const getPaginationParams = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const perPage = Math.min(100, Math.max(1, parseInt(query.perPage) || 20));
  const offset = (page - 1) * perPage;
  return { page, perPage, offset };
};

module.exports = { getPaginationMeta, getPaginationParams };
