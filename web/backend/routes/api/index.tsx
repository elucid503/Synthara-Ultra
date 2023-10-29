import type { ElysiaApp } from "../../server.ts";

import Bun from "bun";

import { jsx } from "../../../../jsx.ts"; // eslint-disable-line

export default (app: ElysiaApp) => app.get("/", () => {

    return Bun.file("./web/frontend/html/api/welcome.html");

});