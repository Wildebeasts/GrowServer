export default defineEventHandler((event) => {
  const { req } = event.node; // Access the Node.js request object
  console.log(`[${req.method}] ${req.url}`);
  // You can log more details like headers, body (if applicable), etc.
  // For example:
  // console.log('Headers:', req.headers);
});