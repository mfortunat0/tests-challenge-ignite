import { app } from "../../../../app";
import request from "supertest";
import { Connection, createConnection } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { hash } from "bcryptjs";

let connection: Connection;
describe("Integration Test - Authenticate User", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    const password = await hash("12345", 8);

    await connection.query(
      `INSERT INTO users (id, name, email, password, created_at)
      values('${uuidv4()}', 'admin', 'teste@test.com', '${password}', 'now()')
      `
    );
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("Should be return a user and token", async () => {
    const response = await request(app).post("/api/v1/sessions").send({
      email: "teste@test.com",
      password: "12345",
    });

    expect(response.body).toHaveProperty("user");
    expect(response.body).toHaveProperty("token");
  });

  it("Should be validate if user email incorrect", async () => {
    const response = await request(app).post("/api/v1/sessions").send({
      email: "notexists@test.com",
      password: "12345",
    });

    expect(response.body.message).toBe("Incorrect email or password");
    expect(response.statusCode).toBe(401);
  });

  it("Should be validate if user password incorrect", async () => {
    const response = await request(app).post("/api/v1/sessions").send({
      email: "teste@test.com",
      password: "noexistpass",
    });

    expect(response.body.message).toBe("Incorrect email or password");
    expect(response.statusCode).toBe(401);
  });
});
