import * as bodyParser from 'body-parser';
import ConfigConstants from './constants/config'
import { Server } from '@overnightjs/core';
import { UserController } from './controllers/userController';
import 'reflect-metadata';
import { createConnection } from 'typeorm';
import { QuestionController } from './controllers/questionController';
import * as cors from 'cors';
import * as dotenv from 'dotenv';
import { AnswerController } from './controllers/answerController';
import * as passport from 'passport';
import authConstants from './constants/auth';
import UserAuth from './models/UserAuth';
import { Session } from './entities/session';
import { TypeormStore } from 'connect-typeorm';
import session = require('express-session');
import cookieParser = require('cookie-parser');


// Load the config
// NOTE: dotenv does not allow overriding env vars, so loading only one of the configs.
// Related - https://github.com/motdotla/dotenv/pull/370
if (process.env.NODE_ENV === 'development') {
    dotenv.config({path: './.dev.env'});
} else {
    dotenv.config();
}

// Setup authentication
passport.serializeUser<UserAuth, string>((user: UserAuth, done) => {
    done(null, JSON.stringify(user));
});

passport.deserializeUser<UserAuth, string>((userData: string, done) => {
    let user: UserAuth = JSON.parse(userData);
    done(null, user);
});


// Setup cors
const corsOptions = {
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'X-Access-Token'],
    credentials: true,
    methods: 'GET,HEAD,OPTIONS,PUT,PATCH,POST,DELETE',
    origin: '*',
    preflightContinue: true,
};

// Setup session options
const sessionOptions = {
    secret: authConstants.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
};

// Setup controllers
class ChowkServer extends Server {
    constructor(sessionStore: any) {
        // super(process.env.NODE_ENV === 'development');
        super(false);
        this.app.use(cors(corsOptions));
        this.app.use(bodyParser.json());
        this.app.use(cookieParser());
        this.app.use(session({
            ...sessionOptions,
            store: sessionStore,
        }));
        this.app.use(passport.initialize());
        this.app.use(passport.session());

        // Support preflight throughout the app
        this.app.options('*', cors());

        super.addControllers(
            [
                new UserController(),
                new QuestionController(),
                new AnswerController(),
            ],
        );
    }

    public start(portNumber: number) {
        this.app.listen(portNumber);
    }
}

async function initializeServer() {
    let port: number;
    const portStr: string | undefined = process.env.PORT;
    if (portStr !== undefined && !isNaN(Number(portStr))) {
        port = Number(portStr);
    } else {
        port = ConfigConstants.DEFAULT_PORT;
    }

    // Connect to db
    console.log('Creating a db-connection - ');

    // Create a db connection
    const connection = await createConnection();

    // Create the session repository
    const sessionRepository = connection.getRepository(Session);
    const sessionStore = new TypeormStore({})
        .connect(sessionRepository);

    // Start the server
    console.log('Starting server');
    console.log(`Listening to port ${port}...`);
    new ChowkServer(sessionStore).start(port);
}

initializeServer().catch(e => {
    console.error(`Error initializing server - ${e}`)
});

