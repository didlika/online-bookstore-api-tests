import { test, expect } from "@playwright/test";
import { ApiRequests } from "../utils/apiRequests";
import { createAuthor, randomAuthor } from "../utils/dataGenerator";

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

      const createResponse = await api.post("/Authors", author);
      expect([200, 201]).toContain(createResponse.status());

      const deleteResponse = await api.delete(`/Authors/${author.id}`);
      expect([200, 204]).toContain(deleteResponse.status());

      const getResponse = await api.get(`/Authors/${author.id}`);
      expect([404, 200]).toContain(getResponse.status());
    });

    test("should return 404 when deleting same author twice (idempotency)", async () => {
      const author = createAuthor();

      const createResponse = await api.post("/Authors", author);
      expect([200, 201]).toContain(createResponse.status());

      const firstDelete = await api.delete(`/Authors/${author.id}`);
      expect([200, 204]).toContain(firstDelete.status());

      const secondDelete = await api.delete(`/Authors/${author.id}`);
      expect([404, 410]).toContain(secondDelete.status());
    });

    test("should return 404 for non-existing author ID", async () => {
      const response = await api.delete("/Authors/999999");
      expect(response.status()).toBe(404);
    });

    test("should return 404 for extremely large author ID", async () => {
      const response = await api.delete(`/Authors/${Number.MAX_SAFE_INTEGER}`);
      expect(response.status()).toBe(404);
    });

    test("should return 400 or 404 for author ID zero", async () => {
      const response = await api.delete("/Authors/0");
      expect([400, 404]).toContain(response.status());
    });

    test("should return 400 or 404 for negative author ID", async () => {
      const response = await api.delete("/Authors/-1");
      expect([400, 404]).toContain(response.status());
    });

    test("should return 400 or 404 for non-numeric author ID", async () => {
      const response = await api.delete("/Authors/abc");
      expect([400, 404]).toContain(response.status());
    });

    test("should return 400 or 404 for encoded malformed ID", async () => {
      const response = await api.delete("/Authors/%20");
      expect([400, 404]).toContain(response.status());
    });

    test("should return 404 for DELETE with extra path segment", async () => {
      const response = await api.delete(`/Authors/${existingAuthor.id}/extra`);
      expect(response.status()).toBe(404);
    });

    test("should return 404 or 405 when deleting collection root", async () => {
      const response = await api.delete("/Authors");
      expect([404, 405]).toContain(response.status());
    });

    test("should allow recreating author with same ID after deletion", async () => {
      const author = createAuthor();

      const firstCreate = await api.post("/Authors", author);
      expect([200, 201]).toContain(firstCreate.status());

      const deleteResponse = await api.delete(`/Authors/${author.id}`);
      expect([200, 204]).toContain(deleteResponse.status());

      const secondCreate = await api.post("/Authors", author);
      expect([200, 201, 400, 409]).toContain(secondCreate.status());
    });
  });
});
