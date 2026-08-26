// Every primary/foreign key in schema.prisma is BigInt (plan §3: "BIGINT
// UNSIGNED AUTO_INCREMENT"), and Prisma returns native JS `bigint` for
// those columns — which JSON.stringify cannot serialize on its own (Express's
// res.json() throws "Do not know how to serialize a BigInt"). Rather than
// manually convert every id field to a string in every service/controller
// (error-prone, and the same mistake would recur on every new endpoint),
// this teaches JSON.stringify itself how to serialize bigint, once, globally.
// Imported for its side effect only — see main.ts.
declare global {
  interface BigInt {
    toJSON(): string;
  }
}

BigInt.prototype.toJSON = function (this: bigint) {
  return this.toString();
};

export {};
