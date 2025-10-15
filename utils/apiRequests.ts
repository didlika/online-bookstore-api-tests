import { request, APIRequestContext } from "@playwright/test";

export class ApiRequests {
  private context!: APIRequestContext;
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async init() {
    this.context = await request.newContext();
  }

  async get(endpoint: string) {
    return this.context.get(`${this.baseUrl}${endpoint}`);
  }

  async post(endpoint: string, data: any) {
    return this.context.post(`${this.baseUrl}${endpoint}`, { data });
  }

  async put(endpoint: string, data: any) {
    return this.context.put(`${this.baseUrl}${endpoint}`, { data });
  }

  async delete(endpoint: string) {
    return this.context.delete(`${this.baseUrl}${endpoint}`);
  }

  async close() {
    await this.context.dispose();
  }
}
