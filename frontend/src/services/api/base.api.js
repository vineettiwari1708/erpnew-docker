const delay = (ms) => new Promise((res) => setTimeout(res, ms));

export const apiResponse = async (data, time = 300) => {
  await delay(time);
  return {
    success: true,
    data
  };
};