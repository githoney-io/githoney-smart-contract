Provide the on-chain validation for a bounty management system.

In the GitHoney system, there are three main actors:

- **Maintainer**: This is the individual or team maintaining a GitHub
  repository and has a task that requires completion within a
  deadline.

- **Contributor**: This is the individual or team that can complete
  the task by submitting a PR.

- **Admin**: A control actor that approves the changes made by the
  contributor and checks that the maintainer doesn't close the
  bounty when the PR is correct, in other words, works as an oracle
  of the work done. Is responsible for accepting the pay to the
  contributor or reclaim of the deposit assets by the
  maintainer.

### The process flow:

1.  A maintainer creates a bounty and deposits the **reward assets**
    (multiasset) indicating the **deadline** to complete the
    task.

2.  (**optional**) Anyone can deposit more assets to increase the
    rewards.

3.  A contributor indicates that is willing to work on the task and is
    assigned to the bounty, only one contributor can do it.

4.  (**optional**) The contributor can decide to delegate the work of
    the assigned bounty to another.

5.  The admin decides if the bounty is **closed** or **merged**, the
    former means that the funds are sent back to the maintainer and
    the merge means that the contributor receives their pay.

### Githoney Fees:

- **Bounty Creation Fee**: The cost of creating a bounty, This is
  planned to be either 1 or 2 ada.

- **Bounty Reward Fee**: This fee is to be paid to GitHoney if PR is
  merged. It will be 5% of the rew
