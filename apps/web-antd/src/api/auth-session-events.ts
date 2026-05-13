type LoginExpiredHandler = () => Promise<void> | void;

let loginExpiredHandler: LoginExpiredHandler | undefined;

export function setLoginExpiredHandler(handler: LoginExpiredHandler): void {
  loginExpiredHandler = handler;
}

export async function notifyLoginExpired(): Promise<void> {
  await loginExpiredHandler?.();
}
