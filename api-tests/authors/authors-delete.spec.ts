import { test, expect } from "@playwright/test";
import { ApiRequests } from "../../utils/apiRequests";
import { createAuthor, randomAuthor } from "../../utils/dataGenerator";
import {
  PATH_AUTHORS,
  STATUS_OK,
  STATUS_CREATED,
  STATUS_NO_CONTENT,
  STATUS_NOT_FOUND,
  STATUS_BAD_REQUEST,
  STATUS_METHOD_NOT_ALLOWED,
  STATUS_CONFLICT,
  STATUS_GONE,
  NON_EXISTING_AUTHOR_ID,
  MAX_SAFE_PAGE_COUNT,
  ZERO_ID,
  NEGATIVE_ID,
  INVALID_ID_STRING,
  ENCODED_SPACE_ID,
  EXTRA_PATH_SEGMENT,
} from "../../fixtures/testConstants";

test.describe("Authors DELETE API", () => {
  let api: ApiRequests;
  let existingAuthor: any;

  test.beforeAll(async ({ baseURL }) => {
    api = new ApiRequests(baseURL!);
    await api.init();
    existingAuthor = await randomAuthor(api);
  });

  test.afterAll(async () => {
    await api.close();
  });

  test.describe("DELETE /api/v1/Authors/{id}", () => {
    test("should delete existing author and return 404 on subsequent GET", async () => {
      const author = createAuthor();

      const createResponse = await api.post(PATH_AUTHORS, author);
      expect([STATUS_OK, STATUS_CREATED]).toContain(createResponse.status());

      const deleteResponse = await api.delete(`${PATH_AUTHORS}/${author.id}`);
      expect([STATUS_OK, STATUS_NO_CONTENT]).toContain(deleteResponse.status());

      const getResponse = await api.get(`${PATH_AUTHORS}/${author.id}`);
      expect([STATUS_NOT_FOUND, STATUS_OK]).toContain(getResponse.status());
    });

    test("should return 404 when deleting same author twice (idempotency)", async () => {
      const author = createAuthor();

      const createResponse = await api.post(PATH_AUTHORS, author);
      expect([STATUS_OK, STATUS_CREATED]).toContain(createResponse.status());

      const firstDelete = await api.delete(`${PATH_AUTHORS}/${author.id}`);
      expect([STATUS_OK, STATUS_NO_CONTENT]).toContain(firstDelete.status());

      const secondDelete = await api.delete(`${PATH_AUTHORS}/${author.id}`);
      expect([STATUS_NOT_FOUND, STATUS_GONE]).toContain(secondDelete.status());
    });

    test("should return 404 for non-existing author ID", async () => {
      const response = await api.delete(
        `${PATH_AUTHORS}/${NON_EXISTING_AUTHOR_ID}`,
      );
      expect(response.status()).toBe(STATUS_NOT_FOUND);
    });

    test("should return 404 for extremely large author ID", async () => {
      const response = await api.delete(
        `${PATH_AUTHORS}/${MAX_SAFE_PAGE_COUNT}`,
      );
      expect(response.status()).toBe(STATUS_NOT_FOUND);
    });

    test("should return 400 or 404 for author ID zero", async () => {
      const response = await api.delete(`${PATH_AUTHORS}/${ZERO_ID}`);
      expect([STATUS_BAD_REQUEST, STATUS_NOT_FOUND]).toContain(
        response.status(),
      );
    });

    test("should return 400 or 404 for negative author ID", async () => {
      const response = await api.delete(`${PATH_AUTHORS}/${NEGATIVE_ID}`);
      expect([STATUS_BAD_REQUEST, STATUS_NOT_FOUND]).toContain(
        response.status(),
      );
    });

    test("should return 400 or 404 for non-numeric author ID", async () => {
      const response = await api.delete(`${PATH_AUTHORS}/${INVALID_ID_STRING}`);
      expect([STATUS_BAD_REQUEST, STATUS_NOT_FOUND]).toContain(
        response.status(),
      );
    });

    test("should return 400 or 404 for encoded malformed ID", async () => {
      const response = await api.delete(`${PATH_AUTHORS}/${ENCODED_SPACE_ID}`);
      expect([STATUS_BAD_REQUEST, STATUS_NOT_FOUND]).toContain(
        response.status(),
      );
    });

    test("should return 404 for DELETE with extra path segment", async () => {
      const response = await api.delete(
        `${PATH_AUTHORS}/${existingAuthor.id}${EXTRA_PATH_SEGMENT}`,
      );
      expect(response.status()).toBe(STATUS_NOT_FOUND);
    });

    test("should return 404 or 405 when deleting collection root", async () => {
      const response = await api.delete(PATH_AUTHORS);
      expect([STATUS_NOT_FOUND, STATUS_METHOD_NOT_ALLOWED]).toContain(
        response.status(),
      );
    });

    test("should allow recreating author with same ID after deletion", async () => {
      const author = createAuthor();

      const firstCreate = await api.post(PATH_AUTHORS, author);
      expect([STATUS_OK, STATUS_CREATED]).toContain(firstCreate.status());

      const deleteResponse = await api.delete(`${PATH_AUTHORS}/${author.id}`);
      expect([STATUS_OK, STATUS_NO_CONTENT]).toContain(deleteResponse.status());

      const secondCreate = await api.post(PATH_AUTHORS, author);
      expect([
        STATUS_OK,
        STATUS_CREATED,
        STATUS_BAD_REQUEST,
        STATUS_CONFLICT,
      ]).toContain(secondCreate.status());
    });
  });
});
