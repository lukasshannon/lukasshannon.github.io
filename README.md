# MIBS Website

Homepage of the McGill Integrative Bioscience Society

- A simple website built for MIBS from McGill University
- Forked from 'so-simple-theme'.

## Installation

### Development Requirements

- [Ruby](https://www.ruby-lang.org/en/documentation/installation/)
- [Jekyll](https://jekyllrb.com/docs/installation/)

### Setup

- Once you have Ruby and Jekyll installed, clone this repository to your computer
- Open a terminal (on Windows: cmd.exe) and navigate to the directory where you saved this repository (e.g. `cd ~/Downloads/mibs-site`)
- Install Gems and other dependencies by entering `gem install bundler jekyll` followed by `bundle install` in your terminal

## How to use

### Structure

The root folder contains:

- `README.md`: this file
- `Gemfile` & `Gemfile.lock`: software dependencies
- `LICENSE`: text explaining usage rights
- `/_config.yml`: global variables
- _.md files_ corresponding to each page on the site including `index.md` for the homepage
- _subdirectories_ to hold each type of data (e.g. `/_profs_cs` holds a file for each of the CS professors)
- `/_site` where the compiled version of the site is saved
- `/_data`: sitemap
- `/_includes`: theme assets
- `/_layouts`: defines page structures
- `/_sass`: styling
- `/assets`: css, html, and images

⋅ As an editor:
⋅⋅ Edit the corresponding `.md` file that matches the name of the path on the website.
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
