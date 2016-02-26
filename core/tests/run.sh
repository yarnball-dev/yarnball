for test in ./*-test.js
do
  node "$test" | ../../node_modules/.bin/tap-spec
done
