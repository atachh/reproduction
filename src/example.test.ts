import { Entity, MikroORM, PrimaryKey, Property } from "@mikro-orm/sqlite";

@Entity()
class User {
  @PrimaryKey()
  id!: number;

  @Property()
  firstName: string;

  @Property()
  lastName: string;

  @Property({ unique: true })
  email: string;

  @Property({
    generated: `(CASE WHEN first_name IS NOT NULL THEN 'chargeback' WHEN last_name IS NOT NULL THEN 'reversed' WHEN email IS NOT NULL THEN 'cancelled' ELSE 'unattempted' END) stored`,
    type: "text",
    nullable: true,
  })
  fullName?: string;

  constructor(firstName: string, lastName: string, email: string) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
  }
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ":memory:",
    entities: [User],
    debug: ["query", "query-params"],
    allowGlobalContext: true, // only for testing
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test("generated columns are correctly processed by SqlSchemaGenerator", async () => {
  const schemaGenerator = orm.getSchemaGenerator();

  const sql = await schemaGenerator.getUpdateSchemaSQL();

  console.log(sql);

  // No changes are required
  expect(sql.length).toBe(0);
});
