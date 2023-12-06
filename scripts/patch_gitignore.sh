#!/bin/bash

# Delete gitignore entry for the dist folder
sed -i "/^\/dist\/$/d" .gitignore

# Replace the /node_modules*/ entry in gitignore with the following
sed -i 's|/node_modules\*/|/node_modules/*\
!/node_modules/jquery\
/node_modules/jquery/*\
!/node_modules/jquery/dist\
/node_modules/jquery/dist/*\
!/node_modules/jquery/dist/jquery.slim.min.*|' .gitignore
