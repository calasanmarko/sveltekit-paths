import { mkdir, readdir, writeFile, watch } from "fs/promises";
import { join } from "path";

const getRoutes = async (dir = "src/routes", basePath = "") => {
    const entries = await readdir(dir, { withFileTypes: true });
    let routes: string[] = [];

    for (const entry of entries) {
        if (entry.isDirectory()) {
            routes = routes.concat(await getRoutes(join(dir, entry.name), `${basePath}/${entry.name}`));
        } else if (entry.name === "+page.svelte" || entry.name === "+page.server.ts" || entry.name === "+server.ts") {
            let route = basePath;

            route = route.replace(/\/\([^)]+\)/gu, "");

            if (!route || route === "") {
                routes.push("/");
                continue;
            }

            const optionalParams = [...route.matchAll(/\/\[\[(?:[^\]]+)\]\]/gu)];
            if (optionalParams.length > 0) {
                let routeWithoutOptional = route;
                for (let i = optionalParams.length - 1; i >= 0; i--) {
                    const [fullMatch] = optionalParams[i];
                    routeWithoutOptional = routeWithoutOptional.replace(fullMatch, "");
                    // Add the route without this optional parameter
                    const tempRoute = routeWithoutOptional.replace(/\[{1,2}(?:[^\]]+)\]{1,2}/gu, "${string}");
                    if (tempRoute !== "/" && tempRoute !== "") {
                        routes.push(tempRoute);
                    }
                }
                // Also add the root route if we removed all segments, or the base route if any remains
                if (routeWithoutOptional === "" || routeWithoutOptional === "/") {
                    routes.push("/");
                } else if (routeWithoutOptional) {
                    // Handle case where there's still a valid path after removing optional params
                    const baseRoute = routeWithoutOptional.replace(/\[{1,2}(?:[^\]]+)\]{1,2}/gu, "${string}");
                    if (baseRoute !== "/" && baseRoute !== "" && !routes.includes(baseRoute)) {
                        routes.push(baseRoute);
                    }
                }
            }

            route = route
                .replace(/\[\.\.\.(?:[^\]]+)\]/gu, "${string}")
                .replace(/\[{1,2}(?:[^\]]+)\]{1,2}/gu, "${string}");

            routes.push(route);
        }
    }

    return Array.from(new Set(routes)).filter((route) => route !== "");
};

const updateRoutes = async () => {
    const routes = await getRoutes();

    const typeContent = `// Auto-generated route definitions
declare module "$sveltekit-paths" {
    export type RoutePath =
      | ${routes.map((route) => `\`${route}\``).join(" \n      | ")};
}
`;

    await mkdir(".svelte-kit/types/sveltekit-paths", { recursive: true });
    await writeFile(".svelte-kit/types/sveltekit-paths/$types.d.ts", typeContent);
};

export const sveltekitPaths = () => ({
    name: "sveltekit-paths",
    configureServer() {
        (async () => {
            for await (const _ of watch("src/routes", { recursive: true })) {
                await updateRoutes();
            }
        })();
    },
    async buildStart() {
        await updateRoutes();
    },
});
