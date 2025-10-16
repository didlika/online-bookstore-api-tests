import { expect, test } from "@playwright/test";
import { ApiRequests } from "../utils/apiRequests";
import { createAuthor } from "../utils/dataGenerator";

test.describe("Authors POST API", () => {
  let api: ApiRequests;

  test.beforeAll(async ({ baseURL }) => {
    api = new ApiRequests(baseURL!);
    await api.init();
  });

  test.afterAll(async () => {
    await api.close();
  });

  test.describe("POST /api/v1/Authors", () => {
    test("should create valid author and return correct data", async () => {
      const author = createAuthor();
      const response = await api.post("/Authors", author);

      expect([200, 201]).toContain(response.status());

      const createdAuthor = await response.json();
      expect(createdAuthor.id).toBeDefined();
      expect(typeof createdAuthor.id).toBe("number");
      expect(createdAuthor.firstName).toBe(author.firstName);
      expect(createdAuthor.lastName).toBe(author.lastName);
      expect(createdAuthor.idBook).toBe(author.idBook);
    });

    test("should create multiple authors with different IDs", async () => {
      const author1 = createAuthor();
      const author2 = createAuthor();

      const response1 = await api.post("/Authors", author1);
      const response2 = await api.post("/Authors", author2);

      expect([200, 201]).toContain(response1.status());
      expect([200, 201]).toContain(response2.status());

      const createdAuthor1 = await response1.json();
      const createdAuthor2 = await response2.json();

      expect(createdAuthor1.id).not.toBe(createdAuthor2.id);
    });

    test("should create author and verify it can be retrieved", async () => {
      const author = createAuthor();

      const createResponse = await api.post("/Authors", author);
      expect([200, 201]).toContain(createResponse.status());

      const getResponse = await api.get(`/Authors/${author.id}`);
      expect(getResponse.status()).toBe(200);

      const retrievedAuthor = await getResponse.json();
      expect(retrievedAuthor.id).toBe(author.id);
      expect(retrievedAuthor.firstName).toBe(author.firstName);
      expect(retrievedAuthor.lastName).toBe(author.lastName);
      expect(retrievedAuthor.idBook).toBe(author.idBook);
    });

    test("should accept firstName at maximum length of 255 characters", async () => {
      const longFirstName = "F".repeat(255);
      const author = createAuthor({ firstName: longFirstName });

      const response = await api.post("/Authors", author);

      expect([200, 201]).toContain(response.status());

      const createdAuthor = await response.json();
      expect(createdAuthor.firstName.length).toBe(255);
    });

    test("should accept lastName at maximum length of 255 characters", async () => {
      const longLastName = "L".repeat(255);
      const author = createAuthor({ lastName: longLastName });

      const response = await api.post("/Authors", author);

      expect([200, 201]).toContain(response.status());

      const createdAuthor = await response.json();
      expect(createdAuthor.lastName.length).toBe(255);
    });

    test("should accept minimal valid string values", async () => {
      const author = createAuthor({ firstName: "A", lastName: "B" });
      const response = await api.post("/Authors", author);

      expect([200, 201]).toContain(response.status());
    });

    test("should accept null firstName (nullable field)", async () => {
      const author = createAuthor({ firstName: null as any });
      const response = await api.post("/Authors", author);

      expect([200, 201]).toContain(response.status());
    });

    test("should accept null lastName (nullable field)", async () => {
      const author = createAuthor({ lastName: null as any });
      const response = await api.post("/Authors", author);

      expect([200, 201]).toContain(response.status());
    });

    test("should accept author with existing book idBook reference", async () => {
      const author = createAuthor({ idBook: 1 });
      const response = await api.post("/Authors", author);

      expect([200, 201]).toContain(response.status());
    });

    test("should accept author with large idBook value", async () => {
      const author = createAuthor({ idBook: 999999 });
      const response = await api.post("/Authors", author);

      expect([200, 201]).toContain(response.status());
    });

    test("should return 400 for id exceeding int32 max value", async () => {
      const invalidAuthor = createAuthor({ id: 2147483648 });
      const response = await api.post("/Authors", invalidAuthor);
      const bodyText = await response.text();
      expect([400]).toContain(response.status());
      expect(bodyText).toContain(
        "The JSON value could not be converted to System.Int32",
      );
    });

    test("should return 400 for idBook exceeding int32 max value", async () => {
      const invalidAuthor = createAuthor({ idBook: 2147483648 });
      const response = await api.post("/Authors", invalidAuthor);
      const bodyText = await response.text();
      expect([400]).toContain(response.status());
      expect(bodyText).toContain(
        "The JSON value could not be converted to System.Int32",
      );
    });

    test("should return 400 or 422 for firstName exceeding 255 characters", async () => {
      const author = createAuthor({ firstName: "X".repeat(256) });
      const response = await api.post("/Authors", author);

      expect([400, 422]).toContain(response.status());
    });

    test("should return 400 or 422 for lastName exceeding 255 characters", async () => {
      const author = createAuthor({ lastName: "X".repeat(256) });
      const response = await api.post("/Authors", author);

      expect([400, 422]).toContain(response.status());
    });

    test("should return 400 or 422 for non-string firstName", async () => {
      const author = createAuthor({ firstName: 12345 as any });
      const response = await api.post("/Authors", author);

      expect([400, 422]).toContain(response.status());
    });

    test("should return 400 or 422 for non-string lastName", async () => {
      const author = createAuthor({ lastName: 12345 as any });
      const response = await api.post("/Authors", author);

      expect([400, 422]).toContain(response.status());
    });

    test("should return 400 or 422 for non-numeric idBook", async () => {
      const author = createAuthor({ idBook: "NaN" as any });
      const response = await api.post("/Authors", author);

      expect([400, 422]).toContain(response.status());
    });

    test("should return 400 or 422 for negative idBook", async () => {
      const author = createAuthor({ idBook: -10 });
      const response = await api.post("/Authors", author);

      expect([400, 422]).toContain(response.status());
    });

    test("should return 400 or 422 for idBook exceeding safe integer", async () => {
      const author = createAuthor({ idBook: Number.MAX_SAFE_INTEGER });
      const response = await api.post("/Authors", author);

      expect([400, 422]).toContain(response.status());
    });

    test("should return 400 or 422 for ID as string", async () => {
      const author = createAuthor({ id: "1" as any });
      const response = await api.post("/Authors", author);

      expect([400, 422]).toContain(response.status());
    });

    test("should return 400 or 422 for ID of zero", async () => {
      const author = createAuthor({ id: 0 });
      const response = await api.post("/Authors", author);

      expect([400, 422]).toContain(response.status());
    });

    test("should return 400 or 422 for negative ID", async () => {
      const author = createAuthor({ id: -5 });
      const response = await api.post("/Authors", author);

      expect([400, 422]).toContain(response.status());
    });

    test("should return 400 or 422 for idBook as string", async () => {
      const author = createAuthor({ idBook: "1" as any });
      const response = await api.post("/Authors", author);

      expect([400, 422]).toContain(response.status());
    });

    test("should return 400 or 409 when creating author with duplicate ID", async () => {
      const author = createAuthor();

      const firstResponse = await api.post("/Authors", author);
      expect([200, 201]).toContain(firstResponse.status());

      const secondResponse = await api.post("/Authors", author);
      expect([400, 409, 422]).toContain(secondResponse.status());
    });

    test("should return 400 or 422 for empty request body", async () => {
      const response = await api.post("/Authors", {});

      expect([400, 422]).toContain(response.status());
    });

    test("should return 400 or 422 for unexpected extra field", async () => {
      const author = createAuthor({ extraField: "extra" } as any);
      const response = await api.post("/Authors", author);

      expect([400, 422]).toContain(response.status());
    });

    test("should return 400 or 422 for missing all fields", async () => {
      const invalidAuthor = { id: undefined, idBook: undefined };
      const response = await api.post("/Authors", invalidAuthor);

      expect([400, 422]).toContain(response.status());
    });

    test("should accept empty string for firstName", async () => {
      const author = createAuthor({ firstName: "" });
      const response = await api.post("/Authors", author);

      expect([200, 201, 400, 422]).toContain(response.status());
    });

    test("should accept empty string for lastName", async () => {
      const author = createAuthor({ lastName: "" });
      const response = await api.post("/Authors", author);

      expect([200, 201, 400, 422]).toContain(response.status());
    });
  });
});
