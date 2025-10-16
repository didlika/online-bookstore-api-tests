import { expect, test } from "@playwright/test";
import { ApiRequests } from "../../utils/apiRequests";
import { getRandomAuthorId, randomAuthor } from "../../utils/dataGenerator";
import {
  PATH_AUTHORS,
  PATH_INVALID_AUTHORS,
  STATUS_OK,
  STATUS_NOT_FOUND,
  NON_EXISTING_AUTHOR_ID,
  ZERO_ID,
} from "../../fixtures/testConstants";

test.describe("Authors GET API", () => {
  let api: ApiRequests;

  test.beforeAll(async ({ baseURL }) => {
    api = new ApiRequests(baseURL!);
    await api.init();
  });

  test.afterAll(async () => {
    await api.close();
  });

  test.describe("GET /api/v1/Authors", () => {
    test("should return all authors with 200 status", async () => {
      const response = await api.get(PATH_AUTHORS);

      expect(response.status()).toBe(STATUS_OK);

      const authors = await response.json();
      expect(Array.isArray(authors)).toBe(true);
      expect(authors.length).toBeGreaterThan(0);
    });

    test("should return authors with valid schema structure", async () => {
      const response = await api.get(PATH_AUTHORS);
      expect(response.status()).toBe(STATUS_OK);

      const authors = await response.json();
      expect(authors.length).toBeGreaterThan(0);

      const firstAuthor = authors[0];
      expect(firstAuthor).toMatchObject({
        id: expect.any(Number),
        idBook: expect.any(Number),
        firstName: expect.any(String),
        lastName: expect.any(String),
      });
    });

    test("should return unique author IDs in collection", async () => {
      const response = await api.get(PATH_AUTHORS);
      expect(response.status()).toBe(STATUS_OK);

      const authors = await response.json();
      const ids = authors.map((author: any) => author.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });

    test("should have all authors with positive IDs", async () => {
      const response = await api.get(PATH_AUTHORS);
      expect(response.status()).toBe(STATUS_OK);

      const authors = await response.json();
      authors.forEach((author: any) => {
        expect(author.id).toBeGreaterThan(0);
        expect(author.idBook).toBeGreaterThan(0);
      });
    });

    test("should return authors sorted by ID", async () => {
      const response = await api.get(PATH_AUTHORS);
      expect(response.status()).toBe(STATUS_OK);

      const authors = await response.json();
      const ids = authors.map((author: any) => author.id);

      for (let i = 0; i < ids.length - 1; i++) {
        expect(ids[i]).toBeLessThanOrEqual(ids[i + 1]);
      }
    });

    test("should return 404 for invalid collection path", async () => {
      const response = await api.get(PATH_INVALID_AUTHORS);
      expect(response.status()).toBe(STATUS_NOT_FOUND);
    });
  });

  test.describe("GET /api/v1/Authors/{id}", () => {
    test("should return author with correct schema for valid ID", async () => {
      const authorId = getRandomAuthorId();
      const response = await api.get(`${PATH_AUTHORS}/${authorId}`);

      expect(response.status()).toBe(STATUS_OK);

      const author = await response.json();
      expect(author).toMatchObject({
        id: authorId,
        idBook: expect.any(Number),
        firstName: expect.any(String      ) ,
        lastName: expect.any(String),
      });
    });

    test("should return consistent data for repeated requests", async () => {
      const authorId = getRandomAuthorId();

      const [response1, response2] = await Promise.all([
        api.get(`${PATH_AUTHORS}/${authorId}`),
        api.get(`${PATH_AUTHORS}/${authorId}`),
      ]);

      expect(response1.status()).toBe(STATUS_OK);
      expect(response2.status()).toBe(STATUS_OK);

      const [author1, author2] = await Promise.all([
        response1.json(),
        response2.json(),
      ]);

      expect(author1).toEqual(author2);
    });

    test("should have valid firstName and lastName", async () => {
      const authorId = getRandomAuthorId();
      const response = await api.get(`${PATH_AUTHORS}/${authorId}`);

      expect(response.status()).toBe(STATUS_OK);

      const author = await response.json();
      expect(author.firstName).toBeTruthy();
      expect(author.lastName).toBeTruthy();
      expect(typeof author.firstName).toBe("string");
      expect(typeof author.lastName).toBe("string");
    });

    test("should fetch random author successfully", async () => {
      const randomAuthorData = await randomAuthor(api);

      const response = await api.get(`${PATH_AUTHORS}/${randomAuthorData.id}`);
      expect(response.status()).toBe(STATUS_OK);

      const author = await response.json();
      expect(author.id).toBe(randomAuthorData.id);
    });

    test("should return 404 for non-existing author", async () => {
      const response = await api.get(
        `${PATH_AUTHORS}/${NON_EXISTING_AUTHOR_ID}`,
      );
      expect(response.status()).toBe(STATUS_NOT_FOUND);
    });

    test("Should return 404 for id 0", async () => {
      const response = await api.get(`${PATH_AUTHORS}/${ZERO_ID}`);
      expect([STATUS_NOT_FOUND]).toContain(response.status());
    });

    test("Should return 404 for negative id", async () => {
      const response = await api.get("/Authors/-1");
      expect([404]).toContain(response.status());
    });

    test("Should return 404 or 400 for non-numeric id", async () => {
      const response = await api.get("/Authors/abc");
      expect([404, 400]).toContain(response.status());
    });

    test("Should return 404 or 400 for encoded malformed id", async () => {
      const response = await api.get("/Authors/%20");
      expect([404, 400]).toContain(response.status());
    });

    test("should return 404 for extra path segment", async () => {
      const authorId = getRandomAuthorId();
      const response = await api.get(`/Authors/${authorId}/extra`);
      expect(response.status()).toBe(404);
    });

    test("should have valid idBook reference", async () => {
      const authorId = getRandomAuthorId();
      const response = await api.get(`/Authors/${authorId}`);

      expect(response.status()).toBe(200);

      const author = await response.json();
      expect(author.idBook).toBeGreaterThan(0);
      expect(Number.isInteger(author.idBook)).toBe(true);
    });

    test("should verify idBook points to existing book", async () => {
      const authorId = getRandomAuthorId();
      const authorResponse = await api.get(`/Authors/${authorId}`);
      expect(authorResponse.status()).toBe(200);

      const author = await authorResponse.json();

      const bookResponse = await api.get(`/Books/${author.idBook}`);
      expect(bookResponse.status()).toBe(200);
      const book = await bookResponse.json();
      expect(book.id).toBe(author.idBook);
    });
  });
});
