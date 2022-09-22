import addons, { makeDecorator } from '@storybook/addons';
import getCookie from './getCookie';

import { ADDON_PARAM_KEY, CLEAR_LABEL } from './constants';

let currentCSS: any = null;

async function addBrandStyles(id: string, files: { [key:string]: any }) {
  let file = files[id];
  if (file) {
    
    // Async support
    file = await file;

    if (file.use) {
      file.use();
    } else if (file.default) { // Support for import as module
      file.default.use();
    } else {
      console.error('Unable to load css file', file);
    }

    // If we've got a CSS file in use, turn it off
    if (currentCSS) {
      if (currentCSS.unuse) {
        currentCSS.unuse();
      } else if (currentCSS.default) { // Support for import as module
        currentCSS.default.unuse();
      } else {
        console.error('Unable to unload css file', currentCSS);
      }
    }

    currentCSS = file;
  }
  if (currentCSS && id === CLEAR_LABEL) {
    if (currentCSS.unuse) {
      currentCSS.unuse();
    } else if (currentCSS.default) { // Support for import as module
      currentCSS.default.unuse();
    } else {
      console.error('Unable to unload css file', currentCSS);
    }
    currentCSS = null;
  }
}

function setCookie(cname: string, cvalue: string, exdays: number) {
  const d = new Date();
  d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
  const expires = `expires=${d.toUTCString()}`;
  document.cookie = `${cname}=${cvalue};${expires};path=/`;
}

function handleStyleSwitch({
  id,
  files,
  save,
}: {
  id: string,
  files: { [key:string]: any },
  save: boolean
}) {
  addBrandStyles(id, files);
  if (save) setCookie('cssVariables', id, 10);
}

export default makeDecorator({
  name: 'CSS Variables Theme',
  parameterName: ADDON_PARAM_KEY,
  wrapper: (getStory, context, { parameters }) => {
    const { files, theme, defaultTheme } = parameters;
    const channel = addons.getChannel();
    const cookieId = getCookie('cssVariables');
    // eslint-disable-next-line max-len
    const savedTheme = cookieId && (Object.hasOwnProperty.call(files, cookieId) || cookieId === CLEAR_LABEL) ? cookieId : null;
    const themeToLoad = theme || savedTheme || defaultTheme;
    handleStyleSwitch({ id: themeToLoad, files, save: !theme || !savedTheme });
    channel.on('cssVariablesChange', ({ id }: { id: string }) => handleStyleSwitch({ id, files, save: true }));

    return getStory(context);
  },
});

export { Dropdown } from './register';
