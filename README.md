# Squiggle query builder

Squiggle allows for named placeholders and optional sub-expressions. It also generates a signature for the query that can be used for caching purposes.

The "?name" syntax is pretty self-explanatory it's just named placeholders.
The "?(" syntax is more of an odd bird. "?( something that uses ?one or ?more )" will only be included if the "one" and "more" parameters are provided.

## Usage

The `Query` constructor takes two parameters: the query name and the query itself. The query name is used for generating a query signature.

`Query.query(params, values, groups)` generates the finished SQL and a parameter array that can be used with the `mysql` or `mysql2` modules.

```javascript
var lib = {
  squiggle: require('squiggle')
};

var q = new lib.squiggle.Query('test',
  "SELECT * FROM TABLE foobar " +
  "WHERE id=?id ?(AND public=?public)" +
  "?(:named AND arbitrary=42 )" +
  "LIMIT $offset, $limit");

console.log(q.query({id:12}, {offset:0, limit:20}));
console.log(q.query({id:12}, {offset:0, limit:20}, {named:true}));
console.log(q.query({id:12, public:true}, {offset:0, limit:10}));
console.log(q.query({id:12, public:true}, {offset:0, limit:10}, {extra:true}));
```

Yields:

```javascript
{ sql: 'SELECT * FROM TABLE foobar WHERE id=? LIMIT 0, 20',
  params: [ 12 ],
  id: 'test:id=12:offset=0&limit=20:' }

{ sql: 'SELECT * FROM TABLE foobar WHERE id=? AND arbitrary=42 LIMIT 0, 20',
  params: [ 12 ],
  id: 'test:id=12:offset=0&limit=20:named=true' }

{ sql: 'SELECT * FROM TABLE foobar WHERE id=? AND public=? LIMIT 0, 10',
  params: [ 12, true ],
  id: 'test:id=12&public=true:offset=0&limit=10:' }

{ sql: 'SELECT * FROM TABLE foobar WHERE id=? AND public=? OR foo=\'bar\' LIMIT 0, 10',
  params: [ 12, true ],
  id: 'test:id=12&public=true:offset=0&limit=10:extra=true' }
```