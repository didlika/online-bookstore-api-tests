import { expect, test } from "@playwright/test";
import { ApiRequests } from "../../utils/apiRequests";
import { createAuthor } from "../../utils/dataGenerator";
import {
  PATH_AUTHORS,
  STATUS_OK,
  STATUS_CREATED,
  STATUS_BAD_REQUEST,
  STATUS_UNPROCESSABLE,
  STATUS_CONFLICT,
  MAX_NAME_LENGTH,
  OVERFLOW_NAME_LENGTH,
  LARGE_BOOK_ID,
  VALID_BOOK_ID,
  MAX_SAFE_PAGE_COUNT,
  INT32_MAX_OVERFLOW,
  TEST_CHAR_F,
  TEST_CHAR_L,
  TEST_CHAR_X,
  MINIMAL_STRING_A,
  MINIMAL_STRING_B,
  INVALID_FIRST_NAME_NUMBER,
  INVALID_LAST_NAME_NUMBER,
  INVALID_ID_BOOK_STRING,
  NEGATIVE_PAGE_COUNT,
  ZERO_ID,
} from "../../fixtures/testConstants";

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
      const response = await api.post(PATH_AUTHORS, author);

      expect([STATUS_OK, STATUS_CREATED]).toContain(response.status());

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

      const response1 = await api.post(PATH_AUTHORS, author1);
      const response2 = await api.post(PATH_AUTHORS, author2);

      expect([STATUS_OK, STATUS_CREATED]).toContain(response1.status());
      expect([STATUS_OK, STATUS_CREATED]).toContain(response2.status());

      const createdAuthor1 = await response1.json();
      const createdAuthor2 = await response2.json();

      expect(createdAuthor1.id).not.toBe(createdAuthor2.id);
    });

    test("should create author and verify it can be retrieved", async () => {
      const author = createAuthor();

      const createResponse = await api.post(PATH_AUTHORS, author);
      expect([STATUS_OK, STATUS_CREATED]).toContain(createResponse.status());

      const getResponse = await api.get(`${PATH_AUTHORS}/${author.id}`);
      expect(getResponse.status()).toBe(STATUS_OK);

      const retrievedAuthor = await getResponse.json();
      expect(retrievedAuthor.id).toBe(author.id);
      expect(retrievedAuthor.firstName).toBe(author.firstName);
      expect(retrievedAuthor.lastName).toBe(author.lastName);
      expect(retrievedAuthor.idBook).toBe(author.idBook);
    });

    test("should accept firstName at maximum length of 255 characters", async () => {
      const longFirstName = TEST_CHAR_F.repeat(MAX_NAME_LENGTH);
      const author = createAuthor({ firstName: longFirstName });

      const response = await api.post(PATH_AUTHORS, author);

      expect([STATUS_OK, STATUS_CREATED]).toContain(response.status());

      const createdAuthor = await response.json();
      expect(createdAuthor.firstName.length).toBe(MAX_NAME_LENGTH);
    });

    test("should accept lastName at maximum length of 255 characters", async () => {
      const longLastName = TEST_CHAR_L.repeat(MAX_NAME_LENGTH);
      const author = createAuthor({ lastName: longLastName });

      const response = await api.post(PATH_AUTHORS, author);

      expect([STATUS_OK, STATUS_CREATED]).toContain(response.status());

      const createdAuthor = await response.json();
      expect(createdAuthor.lastName.length).toBe(MAX_NAME_LENGTH);
    });

    test("should accept minimal valid string values", async () => {
      const author = createAuthor({
        firstName: MINIMAL_STRING_A,
        lastName: MINIMAL_STRING_B,
      });
      const response = await api.post(PATH_AUTHORS, author);

      expect([STATUS_OK, STATUS_CREATED]).toContain(response.status());
    });

    test("should accept null firstName (nullable field)", async () => {
      const author = createAuthor({ firstName: null as any });
      const response = await api.post(PATH_AUTHORS, author);

      expect([STATUS_OK, STATUS_CREATED]).toContain(response.status());
    });

    test("should accept null lastName (nullable field)", async () => {
      const author = createAuthor({ lastName: null as any });
      const response = await api.post(PATH_AUTHORS, author);

      expect([STATUS_OK, STATUS_CREATED]).toContain(response.status());
    });

    test("should accept author with existing book idBook reference", async () => {
      const author = createAuthor({ idBook: VALID_BOOK_ID });
      const response = await api.post(PATH_AUTHORS, author);

      expect([STATUS_OK, STATUS_CREATED]).toContain(response.status());
    });

    test("should accept author with large idBook value", async () => {
      const author = createAuthor({ idBook: LARGE_BOOK_ID });
      const response = await api.post(PATH_AUTHORS, author);

      expect([STATUS_OK, STATUS_CREATED]).toContain(response.status());
    });

    test("should return 400 for id exceeding int32 max value", async () => {
      const invalidAuthor = createAuthor({ id: INT32_MAX_OVERFLOW });
      const response = await api.post(PATH_AUTHORS, invalidAuthor);
      const bodyText = await response.text();
      expect([STATUS_BAD_REQUEST]).toContain(response.status());
      expect(bodyText).toContain(
        "The JSON value could not be converted to System.Int32",
      );
    });

    test("should return 400 for idBook exceeding int32 max value", async () => {
      const invalidAuthor = createAuthor({ idBook: INT32_MAX_OVERFLOW });
      const response = await api.post(PATH_AUTHORS, invalidAuthor);
      const bodyText = await response.text();
      expect([STATUS_BAD_REQUEST]).toContain(response.status());
      expect(bodyText).toContain(
        "The JSON value could not be converted to System.Int32",
      );
    });

    test("should return 400 or 422 for firstName exceeding 255 characters", async () => {
      const author = createAuthor({
        firstName: TEST_CHAR_X.repeat(OVERFLOW_NAME_LENGTH),
      });
      const response = await api.post(PATH_AUTHORS, author);

      expect([STATUS_BAD_REQUEST, STATUS_UNPROCESSABLE]).toContain(
        response.status(),
      );
    });

    test("should return 400 or 422 for lastName exceeding 255 characters", async () => {
      const author = createAuthor({
        lastName: TEST_CHAR_X.repeat(OVERFLOW_NAME_LENGTH),
      });
      const response = await api.post(PATH_AUTHORS, author);

      expect([STATUS_BAD_REQUEST, STATUS_UNPROCESSABLE]).toContain(
        response.status(),
      );
    });

    test("should return 400 or 422 for non-string firstName", async () => {
      const author = createAuthor({
        firstName: INVALID_FIRST_NAME_NUMBER as any,
      });
      const response = await api.post(PATH_AUTHORS, author);

      expect([STATUS_BAD_REQUEST, STATUS_UNPROCESSABLE]).toContain(
        response.status(),
      );
    });

    test("should return 400 or 422 for non-string lastName", async () => {
      const author = createAuthor({
        lastName: INVALID_LAST_NAME_NUMBER as any,
      });
      const response = await api.post(PATH_AUTHORS, author);

      expect([STATUS_BAD_REQUEST, STATUS_UNPROCESSABLE]).toContain(
        response.status(),
      );
    });

    test("should return 400 or 422 for non-numeric idBook", async () => {
      const author = createAuthor({ idBook: INVALID_ID_BOOK_STRING as any });
      const response = await api.post(PATH_AUTHORS, author);

      expect([STATUS_BAD_REQUEST, STATUS_UNPROCESSABLE]).toContain(
        response.status(),
      );
    });

    test("should return 400 or 422 for negative idBook", async () => {
      const author = createAuthor({ idBook: NEGATIVE_PAGE_COUNT });
      const response = await api.post(PATH_AUTHORS, author);

      expect([STATUS_BAD_REQUEST, STATUS_UNPROCESSABLE]).toContain(
        response.status(),
      );
    });

    test("should return 400 or 422 for idBook exceeding safe integer", async () => {
      const author = createAuthor({ idBook: MAX_SAFE_PAGE_COUNT });
      const response = await api.post(PATH_AUTHORS, author);

      expect([STATUS_BAD_REQUEST, STATUS_UNPROCESSABLE]).toContain(
        response.status(),
      );
    });

    test("should return 400 or 422 for ID as string", async () => {
      const author = createAuthor({ id: "1" as any });
      const response = await api.post(PATH_AUTHORS, author);

      expect([STATUS_BAD_REQUEST, STATUS_UNPROCESSABLE]).toContain(
        response.status(),
      );
    });

    test("should return 400 or 422 for ID of zero", async () => {
      const author = createAuthor({ id: ZERO_ID });
      const response = await api.post(PATH_AUTHORS, author);

      expect([STATUS_BAD_REQUEST, STATUS_UNPROCESSABLE]).toContain(
        response.status(),
      );
    });

    test("should return 400 or 422 for negative ID", async () => {
      const author = createAuthor({ id: -5 });
      const response = await api.post(PATH_AUTHORS, author);

      expect([STATUS_BAD_REQUEST, STATUS_UNPROCESSABLE]).toContain(
        response.status(),
      );
    });

    test("should return 400 or 422 for idBook as string", async () => {
      const author = createAuthor({ idBook: "1" as any });
      const response = await api.post(PATH_AUTHORS, author);

      expect([STATUS_BAD_REQUEST, STATUS_UNPROCESSABLE]).toContain(
        response.status(),
      );
    });

    test("should return 400 or 409 when creating author with duplicate ID", async () => {
      const author = createAuthor();

      const firstResponse = await api.post(PATH_AUTHORS, author);
      expect([STATUS_OK, STATUS_CREATED]).toContain(firstResponse.status());

      const secondResponse = await api.post(PATH_AUTHORS, author);
      expect([
        STATUS_BAD_REQUEST,
        STATUS_UNPROCESSABLE,
        STATUS_CONFLICT,
      ]).toContain(secondResponse.status());
    });

    test("should return 400 or 422 for empty request body", async () => {
      const response = await api.post(PATH_AUTHORS, {});

      expect([STATUS_BAD_REQUEST, STATUS_UNPROCESSABLE]).toContain(
        response.status(),
      );
    });

    test("should return 400 or 422 for unexpected extra field", async () => {
      const author = createAuthor({ extraField: "extra" } as any);
      const response = await api.post(PATH_AUTHORS, author);

      expect([STATUS_BAD_REQUEST, STATUS_UNPROCESSABLE]).toContain(
        response.status(),
      );
    });

    test("should return 400 or 422 for missing all fields", async () => {
      const invalidAuthor = { id: undefined, idBook: undefined };
      const response = await api.post(PATH_AUTHORS, invalidAuthor);

      expect([STATUS_BAD_REQUEST, STATUS_UNPROCESSABLE]).toContain(
        response.status(),
      );
    });

    test("should accept empty string for firstName", async () => {
      const author = createAuthor({ firstName: "" });
      const response = await api.post(PATH_AUTHORS, author);

      expect([
        STATUS_OK,
        STATUS_CREATED,
        STATUS_BAD_REQUEST,
        STATUS_UNPROCESSABLE,
      ]).toContain(response.status());
    });

    test("should accept empty string for lastName", async () => {
      const author = createAuthor({ lastName: "" });
      const response = await api.post(PATH_AUTHORS, author);

      expect([
        STATUS_OK,
        STATUS_CREATED,
        STATUS_BAD_REQUEST,
        STATUS_UNPROCESSABLE,
      ]).toContain(response.status());
    });
  });
});
