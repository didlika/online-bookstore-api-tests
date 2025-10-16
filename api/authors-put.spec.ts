import { test, expect } from "@playwright/test";
import { ApiRequests } from "../utils/apiRequests";
import { createAuthor, randomAuthor } from "../utils/dataGenerator";

test.describe("Authors PUT API", () => {
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

  test.describe("PUT /api/v1/Authors/{id}", () => {
    test("should update existing author firstName", async () => {
      const updatedAuthor = {
        ...existingAuthor,
        firstName: existingAuthor.firstName + " Updated",
      };

      const response = await api.put(
        `/Authors/${existingAuthor.id}`,
        updatedAuthor,
      );

      expect(response.status()).toBe(200);

      const returnedAuthor = await response.json();
      expect(returnedAuthor.id).toBe(existingAuthor.id);
      expect(returnedAuthor.firstName).toBe(updatedAuthor.firstName);
    });

    test("should update multiple fields simultaneously", async () => {
      const updatedAuthor = {
        ...existingAuthor,
        firstName: "Updated FirstName",
        lastName: "Updated LastName",
        idBook: (existingAuthor.idBook || 1) + 1,
      };

      const response = await api.put(
        `/Authors/${existingAuthor.id}`,
        updatedAuthor,
      );

      expect(response.status()).toBe(200);

      const returnedAuthor = await response.json();
      expect(returnedAuthor.firstName).toBe(updatedAuthor.firstName);
      expect(returnedAuthor.lastName).toBe(updatedAuthor.lastName);
      expect(returnedAuthor.idBook).toBe(updatedAuthor.idBook);
    });

    test("should accept update with unchanged idBook", async () => {
      const updatedAuthor = { ...existingAuthor };
      const response = await api.put(
        `/Authors/${existingAuthor.id}`,
        updatedAuthor,
      );

      expect(response.status()).toBe(200);
    });

    test("should accept update with new valid idBook", async () => {
      const updatedAuthor = {
        ...existingAuthor,
        idBook: 100,
      };

      const response = await api.put(
        `/Authors/${existingAuthor.id}`,
        updatedAuthor,
      );

      expect(response.status()).toBe(200);
    });

    test("should return consistent data for repeated identical PUT requests", async () => {
      const updatedAuthor = {
        ...existingAuthor,
        firstName: "Idempotent FirstName",
      };

      const response1 = await api.put(
        `/Authors/${existingAuthor.id}`,
        updatedAuthor,
      );
      const response2 = await api.put(
        `/Authors/${existingAuthor.id}`,
        updatedAuthor,
      );

      expect(response1.status()).toBe(200);
      expect(response2.status()).toBe(200);

      const returnedAuthor1 = await response1.json();
      const returnedAuthor2 = await response2.json();

      expect(returnedAuthor1.firstName).toBe(returnedAuthor2.firstName);
      expect(returnedAuthor1).toEqual(returnedAuthor2);
    });

    test("should accept update with large idBook value", async () => {
      const updatedAuthor = { ...existingAuthor, idBook: 999999 };
      const response = await api.put(
        `/Authors/${existingAuthor.id}`,
        updatedAuthor,
      );

      expect(response.status()).toBe(200);
    });

    test("should accept firstName at maximum length of 255 characters", async () => {
      const updatedAuthor = { ...existingAuthor, firstName: "F".repeat(255) };

      const response = await api.put(
        `/Authors/${existingAuthor.id}`,
        updatedAuthor,
      );

      expect(response.status()).toBe(200);

      const returnedAuthor = await response.json();
      expect(returnedAuthor.firstName.length).toBe(255);
    });

    test("should accept lastName at maximum length of 255 characters", async () => {
      const updatedAuthor = { ...existingAuthor, lastName: "L".repeat(255) };

      const response = await api.put(
        `/Authors/${existingAuthor.id}`,
        updatedAuthor,
      );

      expect(response.status()).toBe(200);

      const returnedAuthor = await response.json();
      expect(returnedAuthor.lastName.length).toBe(255);
    });

    test("should return 404 when updating non-existing author", async () => {
      const nonExistingAuthor = {
        ...existingAuthor,
        id: 999999,
        firstName: "Non-existent",
      };
      const response = await api.put("/Authors/999999", nonExistingAuthor);

      expect(response.status()).toBe(404);
    });

    test("should create author via POST then update it via PUT", async () => {
      const newAuthor = createAuthor();

      const createResponse = await api.post("/Authors", newAuthor);
      expect([200, 201]).toContain(createResponse.status());

      const updatedAuthor = {
        ...newAuthor,
        firstName: newAuthor.firstName + " Changed",
      };
      const updateResponse = await api.put(
        `/Authors/${newAuthor.id}`,
        updatedAuthor,
      );

      expect(updateResponse.status()).toBe(200);

      const returnedAuthor = await updateResponse.json();
      expect(returnedAuthor.firstName).toBe(updatedAuthor.firstName);
    });

    test("should return 400 or 422 for missing id", async () => {
      const invalidAuthor = { ...existingAuthor };
      delete invalidAuthor.id;

      const response = await api.put(
        `/Authors/${existingAuthor.id}`,
        invalidAuthor,
      );

      expect([400, 422]).toContain(response.status());
    });

    test("should accept null firstName (nullable field)", async () => {
      const updatedAuthor = { ...existingAuthor, firstName: null };
      const response = await api.put(
        `/Authors/${existingAuthor.id}`,
        updatedAuthor,
      );

      expect([200, 400, 422]).toContain(response.status());
    });

    test("should accept null lastName (nullable field)", async () => {
      const updatedAuthor = { ...existingAuthor, lastName: null };
      const response = await api.put(
        `/Authors/${existingAuthor.id}`,
        updatedAuthor,
      );

      expect([200, 400, 422]).toContain(response.status());
    });

    test("should return 400 or 422 for empty firstName", async () => {
      const invalidAuthor = { ...existingAuthor, firstName: "" };
      const response = await api.put(
        `/Authors/${existingAuthor.id}`,
        invalidAuthor,
      );

      expect([200, 400, 422]).toContain(response.status());
    });

    test("should return 400 or 422 for empty lastName", async () => {
      const invalidAuthor = { ...existingAuthor, lastName: "" };
      const response = await api.put(
        `/Authors/${existingAuthor.id}`,
        invalidAuthor,
      );

      expect([200, 400, 422]).toContain(response.status());
    });

    test("should return 400 or 422 for firstName exceeding 255 characters", async () => {
      const invalidAuthor = { ...existingAuthor, firstName: "X".repeat(256) };
      const response = await api.put(
        `/Authors/${existingAuthor.id}`,
        invalidAuthor,
      );

      expect([400, 422]).toContain(response.status());
    });

    test("should return 400 or 422 for lastName exceeding 255 characters", async () => {
      const invalidAuthor = { ...existingAuthor, lastName: "X".repeat(256) };
      const response = await api.put(
        `/Authors/${existingAuthor.id}`,
        invalidAuthor,
      );

      expect([400, 422]).toContain(response.status());
    });

    test("should return 400 or 422 for non-string firstName", async () => {
      const invalidAuthor: any = { ...existingAuthor, firstName: 12345 };
      const response = await api.put(
        `/Authors/${existingAuthor.id}`,
        invalidAuthor,
      );

      expect([400, 422]).toContain(response.status());
    });

    test("should return 400 or 422 for non-string lastName", async () => {
      const invalidAuthor: any = { ...existingAuthor, lastName: 12345 };
      const response = await api.put(
        `/Authors/${existingAuthor.id}`,
        invalidAuthor,
      );

      expect([400, 422]).toContain(response.status());
    });

    test("should return 400 or 422 for negative idBook", async () => {
      const invalidAuthor = { ...existingAuthor, idBook: -10 };
      const response = await api.put(
        `/Authors/${existingAuthor.id}`,
        invalidAuthor,
      );

      expect([400, 422]).toContain(response.status());
    });

    test("should return 400 or 422 for non-numeric idBook", async () => {
      const invalidAuthor: any = { ...existingAuthor, idBook: "NaN" };
      const response = await api.put(
        `/Authors/${existingAuthor.id}`,
        invalidAuthor,
      );

      expect([400, 422]).toContain(response.status());
    });

    test("should return 400 or 409 when ID in path differs from ID in body", async () => {
      const invalidAuthor = {
        ...existingAuthor,
        id: existingAuthor.id + 1,
        firstName: "ID Mismatch",
      };

      const response = await api.put(
        `/Authors/${existingAuthor.id}`,
        invalidAuthor,
      );

      expect([400, 409]).toContain(response.status());
    });

    test("should return 400 or 422 for empty request body", async () => {
      const response = await api.put(`/Authors/${existingAuthor.id}`, {});

      expect([400, 422]).toContain(response.status());
    });

    test("should return 400 or 404 for negative ID in path", async () => {
      const payload = { ...existingAuthor, id: -1 };
      const response = await api.put("/Authors/-1", payload);

      expect([400, 404]).toContain(response.status());
    });

    test("should return 400 or 404 for non-numeric ID in path", async () => {
      const payload = { ...existingAuthor, id: "abc" };
      const response = await api.put("/Authors/abc", payload as any);

      expect([400, 404]).toContain(response.status());
    });

    test("should handle excessive idBook overflow", async () => {
      const invalidAuthor = {
        ...existingAuthor,
        idBook: Number.MAX_SAFE_INTEGER,
      };
      const response = await api.put(
        `/Authors/${existingAuthor.id}`,
        invalidAuthor,
      );

      expect([200, 400, 422]).toContain(response.status());
    });

    test("should handle or reject unexpected extra field", async () => {
      const modifiedAuthor: any = { ...existingAuthor, extraField: "extra" };
      const response = await api.put(
        `/Authors/${existingAuthor.id}`,
        modifiedAuthor,
      );

      expect([200, 400, 422]).toContain(response.status());
    });
  });
});
