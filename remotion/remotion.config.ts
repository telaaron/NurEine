import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
// H.264, IG-tauglich. Chrome lädt Remotion in CI selbst.
Config.setCodec('h264');
Config.setPixelFormat('yuv420p');
