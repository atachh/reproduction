import {
  DatabaseSchema,
  Entity,
  MikroORM,
  PostgreSqlDriver,
  PrimaryKey,
  Property,
} from "@mikro-orm/postgresql";

@Entity()
class EntityOne {
  @PrimaryKey()
  id!: number;

  @Property()
  col1: string;

  @Property()
  col2: string;

  @Property({ unique: true })
  col3: string;

  @Property({
    generated: `(CASE WHEN (col1 IS NOT NULL) THEN 'one'::text WHEN (col2 IS NOT NULL) THEN 'two'::text WHEN (col3 IS NOT NULL) THEN 'three'::text ELSE 'four'::text END) stored`,
    type: "text",
    nullable: true,
  })
  generated?: string;

  constructor(col1: string, col2: string, col3: string) {
    this.col1 = col1;
    this.col2 = col2;
    this.col3 = col3;
  }
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    driver: PostgreSqlDriver,
    host: "localhost",
    port: 5432,
    user: "postgres",
    password: "postgres",
    dbName: "mikro_orm_test",
    entities: [EntityOne],
    debug: ["schema"],
    allowGlobalContext: true, // only for testing
  });

  await orm.schema.dropDatabase();
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test("generated columns are correctly processed by SqlSchemaGenerator", async () => {
  const actualSchema = await DatabaseSchema.create(
    orm.em.getConnection(),
    orm.em.getPlatform(),
    orm.config,
    orm.em.schema
  );

  const generatedColumn = actualSchema
    .getTable("entity_one")!
    .getColumn("generated")!;

  // Proof that "CASE ... END" generated expressions are parsed as multi-line
  expect(generatedColumn.generated).not.toContain("\n");

  // Proof that the expression is missing the parentheses around "CASE ... END"
  expect(generatedColumn.generated).toContain("(CASE");
  expect(generatedColumn.generated).toContain("END) stored");
});
