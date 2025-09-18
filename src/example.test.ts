import { Entity, MikroORM, PrimaryKey, Property } from "@mikro-orm/sqlite";

const fullNameExpression = `(first_name + ' ' + last_name) STORED`;

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
    generated: fullNameExpression,
    type: "text",
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

  const schema = schemaGenerator.getTargetSchema();
  const table = schema.getTable("user");
  const column = table?.getColumn("full_name");

  const sql = await schemaGenerator.getUpdateSchemaSQL();

  // Schema was created correctly with generated expression
  expect(column?.generated).toEqual(fullNameExpression);

  // No changes are required
  expect(sql.length).toBe(0);
});
