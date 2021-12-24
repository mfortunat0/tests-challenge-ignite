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
const depositOperation = {
  id: uuidv4(),
  amount: 110,
  description: "deposit 100",
  type: "deposit",
};
describe("Integration Test - Get Statement Operation", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    const password = await hash("12345", 8);
    await connection.query("delete from statements where 1 = 1");
    await connection.query(
      `INSERT INTO users (id, name, email, password, created_at)
      values('${user.id}', '${user.name}', '${user.email}', '${password}', 'now()')
      `
    );

    await connection.query(`
    INSERT INTO statements (id, user_id, description,amount, type)
    VALUES
    ('${depositOperation.id}','${user.id}', '${
      depositOperation.description
    }', '${depositOperation.amount}', '${depositOperation.type}'),
    ('${uuidv4()}','${user.id}', 'withdraw 100', '80', 'withdraw')
    `);

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

  it("Should be able to show a operation by id", async () => {
    const response = await request(app)
      .get(`/api/v1/statements/${depositOperation.id}`)
      .set({
        Authorization: `Bearer ${token}`,
      })
      .expect(200);

    const operationInfo = response.body;

    expect(operationInfo).toHaveProperty("id");
    expect(operationInfo.type).toEqual(depositOperation.type);
    expect(operationInfo.id).toEqual(depositOperation.id);
  });

  it("Should be validate if operation exists", async () => {
    const response = await request(app)
      .get(`/api/v1/statements/${uuidv4()}`)
      .set({
        Authorization: `Bearer ${token}`,
      })
      .expect(404);

    const operationInfo = response.body;

    expect(operationInfo.message).toBe("Statement not found");
  });
});
