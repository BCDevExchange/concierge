import app from 'front-end/lib/app/index';
import { start } from 'front-end/lib/framework';
import { debounce, throttle } from 'lodash';

const element = document.getElementById('main') || document.body;
const debug = true;
start(app, element, debug)
  .then(stateManager => {
    // Throttle DOM queries.
    const querySelector = throttle((selector: string) => document.querySelector(selector), 500);

    // Update the bottom CSS position of fixed bars.
    function dispatchFixedBarBottom(): void {
      const footer = querySelector('footer');
      if (!footer) { return; }
      const fixedBarBottom = Math.max(0, window.innerHeight - (footer.offsetTop - window.scrollY));
      stateManager.dispatch({
        tag: 'updateFixedBarBottom',
        value: fixedBarBottom
      });
    }

    const debouncedDispatchFixedBarBottom = debounce(dispatchFixedBarBottom, 200);

    window.addEventListener('scroll', event => {
      debouncedDispatchFixedBarBottom();
    })

    window.addEventListener('resize', event => {
      debouncedDispatchFixedBarBottom();
    })

    stateManager.msgSubscribe(msg => {
      switch (msg.tag) {
        case '@incomingPage':
        case 'toggleIsNavOpen':
          debouncedDispatchFixedBarBottom();
          break;
        case 'pageSignUpBuyer':
        case 'pageSignUpVendor':
        case 'pageSignUpProgramStaff':
        case 'pageTermsAndConditions':
          // Ensure this subscription is not mutually recursive.
          if (msg.value.tag !== 'updateFixedBarBottom') {
            debouncedDispatchFixedBarBottom();
          }
          break;
        default:
          break;
      }
    });

    // Dispatch initial events.
    debouncedDispatchFixedBarBottom();
  });
