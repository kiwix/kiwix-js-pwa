#!/bin/bash

# Delete gitignore entry for the dist folder
sed -i "/^\/dist\/$/d" .gitignore

# Replace the /*node_modules*/ entry in gitignore with the following
sed -i 's|/\*node_modules\*/|/node_modules/*\
!/node_modules/bootstrap\
/node_modules/bootstrap/*\
!/node_modules/bootstrap/dist\
/node_modules/bootstrap/dist/*\
!/node_modules/bootstrap/dist/css\
!/node_modules/bootstrap/dist/css/*\
!/node_modules/bootstrap/dist/js\
!/node_modules/bootstrap/dist/js/*|' .gitignore
