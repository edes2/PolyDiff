import { Application } from '@app/app';
import { SocketManagerService } from '@app/services/playing/socket-manager.service';
import { DatabaseService } from '@app/services/storage/database.service';
import { ServerEvent } from '@common/enums/socket-events';
import http from 'http';
import { AddressInfo } from 'net';
import { Service } from 'typedi';

@Service()
export class Server {
    private static readonly appPort: string | number | boolean = Server.normalizePort(process.env.PORT || '3000');
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    private static readonly baseDix: number = 10;
    private server: http.Server;

    // eslint-disable-next-line max-params
    constructor(
        private readonly application: Application,
        private databaseService: DatabaseService,
        private socketManagerService: SocketManagerService,
    ) {}

    private static normalizePort(val: number | string): number | string | boolean {
        const port: number = typeof val === 'string' ? parseInt(val, this.baseDix) : val;
        if (isNaN(port)) {
            return val;
        } else if (port >= 0) {
            return port;
        } else {
            return false;
        }
    }

    async init(): Promise<void> {
        process.env.TZ = 'America/Montreal';

        this.application.app.set('port', Server.appPort);

        this.server = http.createServer(this.application.app);

        if (!this.databaseService.database) await this.databaseService.init();
        this.socketManagerService.initialize(this.server);
        this.socketManagerService.handleSockets();

        this.server.listen(Server.appPort);
        this.server.on(ServerEvent.Error, (error: NodeJS.ErrnoException) => this.onError(error));
        this.server.on(ServerEvent.Listening, () => this.onListening());
    }

    private onError(error: NodeJS.ErrnoException): void {
        if (error.syscall !== 'listen') {
            throw error;
        }
        const bind: string = typeof Server.appPort === 'string' ? 'Pipe ' + Server.appPort : 'Port ' + Server.appPort;
        switch (error.code) {
            case 'EACCES':
                // eslint-disable-next-line no-console
                console.error(`${bind} requires elevated privileges`);
                process.exit(1);
                break;
            case 'EADDRINUSE':
                // eslint-disable-next-line no-console
                console.error(`${bind} is already in use`);
                process.exit(1);
                break;
            default:
                throw error;
        }
    }

    /**
     * Se produit lorsque le serveur se met à écouter sur le port.
     */
    private onListening(): void {
        const addr = this.server.address() as AddressInfo;
        const bind: string = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
        // eslint-disable-next-line no-console
        console.log(`Listening on ${bind}`);
    }
}
