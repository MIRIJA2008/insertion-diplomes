import { app } from "./app";
import { env } from "./config/env";

app.listen(env.PORT, () => {
  console.log(`API demarree sur http://localhost:${env.PORT}`);
});
