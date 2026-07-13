/**
 * Single switch for the whole app: mock data vs. the real mini-trello-backend.
 *
 * Defaults to MOCK unless NEXT_PUBLIC_USE_MOCK_API is explicitly "false" — so a
 * fresh checkout with no .env.local still runs standalone. Once the backend is
 * ready, set NEXT_PUBLIC_USE_MOCK_API=false in .env.local (see .env.local.example)
 * and nothing else in the app needs to change — every component imports authApi /
 * boardApi / etc. from this file, never from api-real.ts or api-mock.ts directly.
 */
export const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK_API !== "false";

import { authApiMock, boardApiMock, commentApiMock, listApiMock, notificationApiMock, taskApiMock } from "./api-mock";
import {
  authApiReal,
  boardApiReal,
  commentApiReal,
  listApiReal,
  notificationApiReal,
  taskApiReal,
} from "./api-real";

export const authApi = USE_MOCK_API ? authApiMock : authApiReal;
export const boardApi = USE_MOCK_API ? boardApiMock : boardApiReal;
export const listApi = USE_MOCK_API ? listApiMock : listApiReal;
export const taskApi = USE_MOCK_API ? taskApiMock : taskApiReal;
export const commentApi = USE_MOCK_API ? commentApiMock : commentApiReal;
export const notificationApi = USE_MOCK_API ? notificationApiMock : notificationApiReal;

export { resetMockDb } from "./mock/db";
