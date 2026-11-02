import apiClient from './apiClient';

// GET /api/recurring
export const getRecurringApi = async () => {
  try {
    const response = await apiClient.get('/recurring');
    return response.data.bills ?? [];
  } catch (err) {
    // Express answers an unknown route with an HTML 404 that has no JSON
    // `message`. That means a server that predates recurring bills: show none
    // rather than break Home. A real 404 does carry a message.
    if (err?.status === 404 && !err?.data?.message) return [];
    throw err;
  }
};

// POST /api/recurring. Dates are "YYYY-MM-DD" calendar days.
export const createRecurringApi = async data =>
  (await apiClient.post('/recurring', data)).data;

// PUT /api/recurring/:id
export const updateRecurringApi = async (id, data) =>
  (await apiClient.put(`/recurring/${id}`, data)).data;

// DELETE /api/recurring/:id
export const deleteRecurringApi = async id =>
  (await apiClient.delete(`/recurring/${id}`)).data;

// PATCH /api/recurring/:id/pay  body: { dueDate, amount?, accountId? }
export const payRecurringApi = async (id, body) =>
  (await apiClient.patch(`/recurring/${id}/pay`, body)).data;

// PATCH /api/recurring/:id/skip  body: { dueDate }
export const skipRecurringApi = async (id, body) =>
  (await apiClient.patch(`/recurring/${id}/skip`, body)).data;
