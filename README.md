# Squiggle query builder

Squiggle allows for named placeholders and optional sub-expressions. It also generates a signature for the query that can be used for caching purposes.

The "?name" syntax is pretty self-explanatory it's just named placeholders.The "?(" syntax is more of an odd bird and allows to to create a chunk of sql (a group) is used conditionally "?( AND a=?one AND b=?more )" will only be included if the "one" and "more" parameters are provided. And groups can also be named the using the syntax "?(:named ...)" which and then switched on or off using the groups parameter.

## Usage

The `Query` constructor takes two parameters: the query name and the query itself. The query name is used for generating a query signature.

`Query.query(spec)` generates the finished SQL and a parameter array that can be used with the `mysql` or `mysql2` modules.
`Query.id(spec)` generates a stable identifier that can be used with caching systems.

```javascript
var lib = {
  squiggle: require('./')
};

var q = new lib.squiggle.Query('test',
  "SELECT * FROM TABLE foobar " +
  "WHERE id=?id ?(AND public=?public )" +
  "?(:named AND arbitrary=42 )" +
  "LIMIT $offset, $limit");

var examples = [
  {
    params: {id:12},
    values: {offset:0, limit:20}
  },
  {
    params: {id:2},
    values: {offset:0, limit:20},
    groups: {named:true}
  },
  {
    params: {id:5, public:true},
    values: {offset:0, limit:10}
  }
];

examples.forEach(function(spec, idx) {
  console.log('var id%d = %j;', idx, q.id(spec));
  console.dir(q.query(spec));
  console.log('');
});
```

Yields:

```javascript
var id0 = "test:id=12:offset=0&limit=20:"
{ sql: 'SELECT * FROM TABLE foobar WHERE id=? LIMIT 0, 20',
  params: [ 12 ] }

var id1 = "test:id=2:offset=0&limit=20:named=true"
{ sql: 'SELECT * FROM TABLE foobar WHERE id=? AND arbitrary=42 LIMIT 0, 20',
  params: [ 2 ] }

var id2 = "test:id=5&public=true:offset=0&limit=10:"
{ sql: 'SELECT * FROM TABLE foobar WHERE id=? AND public=? LIMIT 0, 10',
  params: [ 5, 1 ] }
```
