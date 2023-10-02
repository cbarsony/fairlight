export const api = {
  validateUser: async (username) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return username.length >= 3;
  },
};
