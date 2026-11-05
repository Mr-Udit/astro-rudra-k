export function getPagination(query = {}) {
  const page =
    Number.isInteger(+query.page) && +query.page > 0
      ? +query.page
      : 1;

  const limitRaw =
    Number.isInteger(+query.limit) && +query.limit > 0
      ? +query.limit
      : 10;

  const limit = limitRaw > 50 ? 50 : limitRaw;

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}
