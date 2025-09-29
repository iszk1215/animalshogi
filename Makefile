all: docs/output.css

docs/output.css: input.css docs/*.html docs/*.js
	npx @tailwindcss/cli -i input.css -o $@
