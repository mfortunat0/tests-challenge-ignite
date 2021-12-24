import { app } from "../../../../app";
import request from "supertest";
import { Connection, createConnection } from "typeorm";

let connection: Connection;
describe("Integration Test - Create User", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("Should be able to create a new user", async () => {
    await request(app)
      .post("/api/v1/users")
      .send({
        name: "test",
        email: "teste@test.com",
        password: "12345",
      })
      .expect(201);
  });

  it("Should validate if user email has unique", async () => {
    const response = await request(app).post("/api/v1/users").send({
      name: "test",
      email: "teste@test.com",
      password: "12345",
    });

    expect(response.body.message).toBe("User already exists");
    expect(response.statusCode).toBe(400);
  });
});
