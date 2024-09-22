const app = require('./index'); // Import the app without starting the server
const logger = require('./utils/logger');

const port = process.env.PORT || 3000;

app.listen(port, () => {
    logger.info(`Server running on port ${port}`);
});
