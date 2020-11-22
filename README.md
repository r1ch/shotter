# shotter
You know the rules.

## run locally
### Get the pages running

```
gem install bundler
bundle install
bundle exec jekyll serve
```

## Get the websocket stub running
```
npm ci
node test.js
```
Local environment detection via jekyll.environment (see _layouts/default to see the detection code)
