import Config from "../config";
import {Application} from "express";

export const logRouting = (app: Application) => {
    if (Config.MODE === "development") {
        console.log("Available routes:");

        const stack = app._router?.stack || [];

        stack.forEach((layer: any) => {
            if (layer.route) {
                const methods = Object.keys(layer.route.methods)
                    .map(m => m.toUpperCase())
                    .join(", ");

                console.log(`- ${methods} ${layer.route.path}`);
            }
        });
    }
};
