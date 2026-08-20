const EAS_ENVIRONMENTS = new Set(['development', 'preview', 'production']);
const EAS_DISTRIBUTIONS = new Set(['internal', 'store']);

function refusal(message) {
  return `${message} Refusing to skip social-recovery preflight.`;
}

function assertBuildProfiles(buildProfiles) {
  if (
    !buildProfiles ||
    typeof buildProfiles !== 'object' ||
    Array.isArray(buildProfiles)
  ) {
    throw new Error(refusal('eas.json must define build profiles.'));
  }
}

function assertProfileName(profileName) {
  if (typeof profileName !== 'string' || !profileName.trim()) {
    throw new Error(
      refusal('EAS build profile name must be a non-empty string.')
    );
  }
}

function assertProfile(profileName, profile) {
  if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
    throw new Error(refusal(`EAS build profile "${profileName}" is missing.`));
  }
}

function assertValidProfileFields(profileName, profile) {
  if (
    profile.environment !== undefined &&
    (typeof profile.environment !== 'string' ||
      !EAS_ENVIRONMENTS.has(profile.environment))
  ) {
    throw new Error(
      refusal(
        `EAS build profile "${profileName}" environment must be one of development, preview, or production.`
      )
    );
  }

  if (
    profile.developmentClient !== undefined &&
    typeof profile.developmentClient !== 'boolean'
  ) {
    throw new Error(
      refusal(
        `EAS build profile "${profileName}" developmentClient must be boolean.`
      )
    );
  }

  if (
    profile.distribution !== undefined &&
    (typeof profile.distribution !== 'string' ||
      !EAS_DISTRIBUTIONS.has(profile.distribution))
  ) {
    throw new Error(
      refusal(
        `EAS build profile "${profileName}" distribution must be internal or store.`
      )
    );
  }

  if (
    profile.extends !== undefined &&
    (typeof profile.extends !== 'string' || !profile.extends.trim())
  ) {
    throw new Error(
      refusal(
        `EAS build profile "${profileName}" has an invalid extends value.`
      )
    );
  }
}

function resolveEasEnvironment(resolvedProfile) {
  if (resolvedProfile.environment !== undefined) {
    return resolvedProfile.environment;
  }

  if (resolvedProfile.developmentClient === true) return 'development';
  if (resolvedProfile.distribution === 'internal') return 'preview';
  return 'production';
}

function resolveEasBuildProfile(buildProfiles, profileName) {
  assertBuildProfiles(buildProfiles);
  assertProfileName(profileName);

  const profileChain = [];
  const visitedProfiles = new Set();
  let currentProfileName = profileName.trim();

  while (currentProfileName) {
    if (visitedProfiles.has(currentProfileName)) {
      throw new Error(
        refusal(
          `EAS build profile inheritance cycle: ${[
            ...profileChain,
            currentProfileName,
          ].join(' -> ')}.`
        )
      );
    }
    visitedProfiles.add(currentProfileName);

    if (
      !Object.prototype.hasOwnProperty.call(buildProfiles, currentProfileName)
    ) {
      throw new Error(
        refusal(`EAS build profile "${currentProfileName}" is missing.`)
      );
    }

    const profile = buildProfiles[currentProfileName];
    assertProfile(currentProfileName, profile);
    assertValidProfileFields(currentProfileName, profile);
    profileChain.push(currentProfileName);
    currentProfileName = profile.extends?.trim() || '';
  }

  const resolvedProfile = profileChain
    .reverse()
    .reduce((resolved, currentName) => {
      return { ...resolved, ...buildProfiles[currentName] };
    }, {});

  return {
    ...resolvedProfile,
    environment: resolveEasEnvironment(resolvedProfile),
  };
}

module.exports = { resolveEasBuildProfile };
