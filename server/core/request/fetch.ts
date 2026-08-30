export const apiFetch = $fetch.create({
  baseURL: 'https://api.steampowered.com',
  retry: 1,
  retryDelay: 500,
  timeout: 15_000,
})
