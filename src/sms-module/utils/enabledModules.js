/*
 * Rail-mill (Rites) modules that are open to users in SARTHI.
 * Backend for all modules is merged (com.sarthi.Sms); only the ones listed here are shown / reachable.
 * To open another stage later, add its key here — nothing else needs to change.
 *
 * keys: sms, rolling, ndt, testing, vi, welding, sri (short rail), qct, calibration
 */
export const ENABLED_RAILMILL_MODULES = ['sms', 'rolling', 'ndt'];

/** duty permission -> module key */
const PERMISSION_MODULE = {
  'duty-sms': 'sms',
  'duty-rolling': 'rolling',
  'duty-ndt': 'ndt',
  'duty-testing': 'testing',
  'duty-vi': 'vi',
  'duty-welding': 'welding',
  'duty-sri': 'sri',
  'duty-sr-inspection': 'sri',
  'duty-qct': 'qct',
  'duty-calibration': 'calibration',
};

export const isModuleEnabled = (moduleKey) => !moduleKey || ENABLED_RAILMILL_MODULES.includes(moduleKey);

/** false only for permissions that belong to a disabled module; every other permission is unaffected */
export const isPermissionModuleEnabled = (permission) => isModuleEnabled(PERMISSION_MODULE[permission]);
