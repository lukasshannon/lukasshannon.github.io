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

### Viewing locally

- To view the website locally, run `bundle exec jekyll serve` in your terminal and then navigate to `localhost:4000` in your browser
- Another simple way to run the project locally would be by using the "[Webserver plugin for Chrome](https://chrome.google.com/webstore/detail/web-server-for-chrome/ofhbbkphhbklhfoeikjpcbhemlocgigb?hl=en). Select the folder `_site` after running the app and navigate to the specified port with `localhost:<PortNumber>`.

### Directory structure

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

### How to edit

- Edit the corresponding `.md` file that matches the path name of the page on the website
- Build the files after editing all needed content with `bundle exec jekyll build`
- This should generate the updated `_site` folder

### Editing markdown files

- Under normal circumstances, do not modify the first block of variables. These contain sensitive and important data for the website to work, such as `permalink`, `layout`, etc.
- Some exceptions are the `title` variable (which will be unique to each page) and the context-specific variables relating to the details of particular faculties, alumni, council members, etc.
- The variables' names are meant to be easy to understand, and even if you're having difficulty, simply see where the associated text appears on the website itself before editing.
- Each of the council members, staff members, events, etc. ("records") is an individual file which are all sorted into folders by type. You can edit the details of any record by looking in the collection it's part of and finding the corresponding file in that folder. For example, if you want to add a new council member, simply go to the `_council_members` folder and add a new `.md` file, strictly following the structure of a council member:

```
---
number: <Number>
name: <Name>
position: <Position>
image: <Image>
---
<TextDescription>
```

- Text formatting follows usual markdown `.md` rules (for help, consult this [page](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet))

### Editing images

- On pages with images, you will see a corresponding `image` variable at the head of the `.md` file.
- You can specify the path of any image saved under `assets/images/<ImageName/>` . The recommended formats are .jpg and .png.
- Additional information can be inserted for images as follows:

```
image:
    path: assets/images/RVH-crop.jpg
    caption: "McGill University Campus"
```

## Deploying

- Github Pages support is out-of-the-box. Simply create a repository named <username>.github.io and push the project folder. On the 'Settings' section of your repository, enable Github-Pages, and you're done. Github will automatically give you a subdomain, but in order to use another DNS, simply include the CNAME file in the repository root.
- Otherwise, depending on the deployment environment, usually all you need to do is to drop the `_site` folder on your chosen web server's root directory.
- [Check the Jekyll documentation for further details](https://jekyllrb.com/docs/github-pages/#deploying-jekyll-to-github-pages)

## Credits

- [Lukas Shannon](https://lukasshannon.github.io)
- [Eugen Yzeiri](https://geni94.github.io)
