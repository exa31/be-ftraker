import Config from "../config";
import {MergeElysiaInstances} from "elysia";

export const logrouting = (ctx: MergeElysiaInstances) => {
    if (Config.MODE === 'development') {
        console.log("Available routes:");
        ctx.routes.forEach(route => {
            console.log(`- ${route.method} ${route.path}`);
        });
    }
}