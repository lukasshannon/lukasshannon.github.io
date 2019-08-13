# MIBS Website

Homepage of the McGill Integrative Bioscience Society

## Overview

- A simple website built for MIBS from McGill University.
- Built with Jekyll. Forked from 'so-simple-theme'.

## How to use

- Install Jekyll (as described (here)[https://jekyllrb.com/docs/installation/])
- Open your cmd/terminal and navigate to the directory folder (with the `cd <YourPath/>` command)
- Install Gems and needed files with `gem install bundler jekyll` and `bundle install`

- As an editor:
  -- Edit the corresponding `.md` file that matches the name of the path on the website.
  -- Build the files after editing all needed content with `bundle exec jekyll build`
  -- This should generate the `_site` folder.
  -- View the website locally: run `bundle exec jekyll serve` on your terminal and then navigate to `localhost:4000` in your browser.
  -- Amother simple way to run the project locally, would be by using the "Webserver plugin for Chrome"[https://chrome.google.com/webstore/detail/web-server-for-chrome/ofhbbkphhbklhfoeikjpcbhemlocgigb?hl=en]. Simply select the folder `_site` after running the app and navigate to the specified port with `localhost:<PortNumber>`.

### How to correctly edit a markdown file

- Do not modify the first block of variables. Usually these contain sensitive and important data for the website to work, such as `permalink`, `layout`, etc. The only exception is the `title` variable.
- For the Faculties' pages, you can edit the corresponding variables related to the each facultie's details. The variables' names are easy to understand, and even if you're having difficulty, simply see where the text goes on the website itself before editing.
- The same approach follows the Alumni, Council, Events, etc.
- The Council Members and each Faculty staff members, are organized in folders and collections. You can notice each Faculty collection of members and edit the corresponding info by finding the corresponding file in that folder. For example, if you want to edit the professors list of Biology, you simply go to the `_profs_chemistry` folder, and add a new `.md` file, strictly following the structure of a staff member:

```
---
name: <Name>
title: <Title>
classes: <Classes>
office: <Office>
---
```

- Text formatting follows the same rules usual markdown files (you can consult this (page)[https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet])

### Images

- On pages where images are included, you will see the corresponding `image` variable at the head of the `.md` file.
- You can edit this accordingly by specifying the path of your inserted image. You will need to always paste your new images at `assets/images/<ImageName/>` . The recommended formats are .jpg and .png.
- Additional information can be inserted for images, as follows:
  (example)

```
image:
    path: assets/images/RVH-crop.jpg
    caption: "McGill University Campus"
```

## Deploying

- Depending on the deployment environment, all you need to usually do is to simply drop the `_site` folder on the corresponding web server root directory.
- (Check the Jekyll documentation for further details)[https://jekyllrb.com/docs/github-pages/#deploying-jekyll-to-github-pages]
- Note: Github Pages support is out-of-the-box, i.e create a simple directory and push the project folder; on the 'Settings' section of your repository, enable GH-Pages, and you're done. Github will give you the generated subdomain. In order to use another DNS, simply include the CNAME file in the repository root.

-- Crafted by (E.Y)[https://geni94.github.io]
