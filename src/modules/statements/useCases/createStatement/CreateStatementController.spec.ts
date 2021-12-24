import { app } from "../../../../app";
import request from "supertest";
import { Connection, createConnection } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { hash } from "bcryptjs";
import { sign } from "jsonwebtoken";
import authConfig from "../../../../config/auth";

let connection: Connection;
let token: string;
const user = {
  id: uuidv4(),
  name: "juvenal sauro",
  email: "juvenal@test.com.br",
};
describe("Integration Test - Create Statement", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    const password = await hash("12345", 8);

    await connection.query(
      `INSERT INTO users (id, name, email, password, created_at)
      values('${user.id}', '${user.name}', '${user.email}', '${password}', 'now()')
      `
    );
    const { expiresIn, secret } = authConfig.jwt;
    token = sign({ user }, secret, {
      subject: user.id,
      expiresIn,
    });
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  beforeEach(async () => {
    await connection.query("delete from statements where 1 = 1");
  });

  it("Should be able to create a deposit statement", async () => {
    const deposit = {
      amount: 100,
      description: "deposit 100",
    };
    const response = await request(app)
      .post("/api/v1/statements/deposit")
      .send(deposit)
      .set({
        Authorization: `Bearer ${token}`,
      })
      .expect(201);

    const depositInfo = response.body;
    expect(depositInfo).toHaveProperty("id");
    expect(depositInfo.amount).toEqual(deposit.amount);
    expect(depositInfo.description).toEqual(deposit.description);
    expect(depositInfo.type).toEqual("deposit");
  });

  it("Should be able to create a withdrawn statement", async () => {
    await request(app)
      .post("/api/v1/statements/deposit")
      .send({ amount: 100, description: "deposit 100" })
      .set({
        Authorization: `Bearer ${token}`,
      });
    const withdraw = {
      amount: 90,
      description: "withdraw 90",
    };
    const response = await request(app)
      .post("/api/v1/statements/withdraw")
      .send(withdraw)
      .set({
        Authorization: `Bearer ${token}`,
      })
      .expect(201);

    const withdrawInfo = response.body;
    expect(withdrawInfo).toHaveProperty("id");
    expect(withdrawInfo.amount).toEqual(withdraw.amount);
    expect(withdrawInfo.description).toEqual(withdraw.description);
    expect(withdrawInfo.type).toEqual("withdraw");
  });

  it("Should be verify if user has founds to withdraw", async () => {
    await request(app)
      .post("/api/v1/statements/deposit")
      .send({ amount: 100, description: "deposit 100" })
      .set({
        Authorization: `Bearer ${token}`,
      });
    const withdraw = {
      amount: 101,
      description: "withdraw 101",
    };
    const response = await request(app)
      .post("/api/v1/statements/withdraw")
      .send(withdraw)
      .set({
        Authorization: `Bearer ${token}`,
      })
      .expect(400);

    const withdrawInfo = response.body;
    expect(withdrawInfo.message).toBe("Insufficient funds");
  });
});
