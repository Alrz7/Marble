import { AuthMethod } from "@internal/intrCmnTypes";
import { InitAndMigrate } from "@db/dbCore";
import { getActiveUserId } from "@db/dbUsers.ts";
import { err, ok, Result } from "@internal/golog";
import { GetUserAuthMethod } from "@db/dbAuthHelpers";

export async function getActiveUserAuthMethod(): Promise<
  Result<{ id: number; method: AuthMethod } | null>
> {
  await InitAndMigrate();
  const actUser_id = await getActiveUserId();
  if (!actUser_id.ok) {
    return err(actUser_id.error);
  }
  if (actUser_id.value < 0) return ok(null);

  const authMethod = await GetUserAuthMethod(actUser_id.value);
  if (!authMethod.ok) {
    return err(authMethod.error);
  }
  return ok({ id: actUser_id.value, method: authMethod.value });
}
