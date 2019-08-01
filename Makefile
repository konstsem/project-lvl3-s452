develop:
	npx webpack-dev-server

install-deps:
	npm install

build:
	rm -rf dist
	NODE_ENV=production npm run webpack

test:
	npm test

lint:
	npx eslint .

publish:
	npm publish --dry-run

.PHONY: test
