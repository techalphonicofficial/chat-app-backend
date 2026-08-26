const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

const routesPath = path.join(__dirname, '..', 'routes', '*.js');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Chat App API',
            version: '1.0.0',
            description: 'API documentation for the Chatting Application backend',
        },
        components: {

            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                }
            }
        },
    },
    apis: [routesPath],
};


const specs = swaggerJsdoc(options);

module.exports = {
    swaggerUi,
    specs,
};
